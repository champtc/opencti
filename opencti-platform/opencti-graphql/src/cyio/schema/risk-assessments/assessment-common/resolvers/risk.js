import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import {compareValues, updateQuery, filterValues} from '../../../utils.js';
import {UserInputError} from "apollo-server-express";
import { calculateRiskLevel, getLatestRemediationInfo } from '../../riskUtils.js';
import { findParentIriQuery, objectMap } from '../../../global/global-utils.js';
import {
  selectLabelByIriQuery,
  selectExternalReferenceByIriQuery,
  selectNoteByIriQuery,
  getReducer as getGlobalReducer,
} from '../../../global/resolvers/sparql-query.js';
import {
  attachToPOAMQuery,
  detachFromPOAMQuery,
} from '../../poam/resolvers/sparql-query.js';
import {
  getReducer, 
  insertRiskQuery,
  selectRiskQuery,
  selectAllRisks,
  deleteRiskQuery,
  riskPredicateMap,
  selectCharacterizationByIriQuery,
  selectMitigatingFactorByIriQuery,
  selectObservationByIriQuery,
  selectRiskResponseByIriQuery,
  selectRiskLogEntryByIriQuery,
  deleteOriginByIriQuery,
  selectOriginByIriQuery,
} from './sparql-query.js';


const riskResolvers = {
  Query: {
    risks: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllRisks(selectMap.getNode("node"), args);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: "Select Risk List",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer("RISK");
        let filterCount, resultCount, limit, offset, limitSize, offsetSize;
        limitSize = limit = (args.first === undefined ? response.length : args.first) ;
        offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;
        filterCount = 0;

        // update the risk level and score before sorting
        for (let risk of response) {
          risk.risk_level = 'unknown';
          if (risk.cvss2_base_score !== undefined || risk.cvss3_base_score !== undefined) {
            // calculate the risk level
            const {riskLevel, riskScore} = calculateRiskLevel(risk);
            risk.risk_score = riskScore;
            risk.risk_level = riskLevel;

            // clean up
            delete risk.cvss2_base_score;
            delete risk.cvss2_temporal_score;
            delete risk.cvss3_base_score
            delete risk.cvss3_temporal_score;
            delete risk.available_exploit;
            delete risk.exploitability_ease;
          }

          // retrieve most recent remediation state
          if (risk.remediation_type !== undefined) {
            const {responseType, lifeCycle} = getLatestRemediationInfo(risk);
            if (responseType !== undefined) risk.response_type = responseType;
            if (lifeCycle !== undefined) risk.lifecycle = lifeCycle;
            // clean up
            delete risk.remediation_response_date;
            delete risk.remediation_type;
            delete risk.remediation_lifecycle;
          }

          // calculate the occurrence count
          if (risk.related_observations !== undefined ) {
            risk.occurrences = risk.related_observations.length;
          } else { risk.occurrences = 0; }
  
          // fix up deviation values
          if (risk.risk_status == 'deviation_requested' || risk.risk_status == 'deviation_approved') {
            console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${risk.iri} invalid field value 'risk_status'; fixing`);
            risk.risk_status = risk.risk_status.replace('_', '-');
          }
        }

        // sort the values
        let riskList, sortBy ;
        if (args.orderedBy !== undefined ) {
          if (args.orderedBy === 'risk_level') {
            sortBy = 'risk_score';
          } else { sortBy = args.orderedBy; }
          riskList = response.sort(compareValues(sortBy, args.orderMode ));
        } else {
          riskList = response;
        }

        if (offset > riskList.length) return null;

        // for each Risk in the result set
        for (let risk of riskList) {
          // skip down past the offset
          if (offset) {
            offset--
            continue
          }

          // if (risk.id === undefined || risk.id == null ) {
          //   console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${risk.iri} missing field 'id'; skipping`);
          //   continue;
          // }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(risk, args.filters, args.filterMode) ) {
              continue
            }
            filterCount++;
          }

          // if haven't reached limit to be returned
          if (limit) {
            let edge = {
              cursor: risk.iri,
              node: reducer(risk),
            }
            edges.push(edge)
            limit--;
            if (limit === 0) break;
          }
        }
        // check if there is data to be returned
        if (edges.length === 0 ) return null;
        let hasNextPage = false, hasPreviousPage = false;
        resultCount = riskList.length;
        if (edges.length < resultCount) {
          if (edges.length === limitSize && filterCount <= limitSize ) {
            hasNextPage = true;
            if (offsetSize > 0) hasPreviousPage = true;
          }
          if (edges.length <= limitSize) {
            if (filterCount !== edges.length) hasNextPage = true;
            if (filterCount > 0 && offsetSize > 0) hasPreviousPage = true;
          }
        }
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (hasNextPage ),
            hasPreviousPage: (hasPreviousPage),
            globalCount: resultCount,
          },
          edges: edges,
        }
      } else {
        // Handle reporting Stardog Error
        if (typeof (response) === 'object' && 'body' in response) {
          throw new UserInputError(response.statusText, {
            error_details: (response.body.message ? response.body.message : response.body),
            error_code: (response.body.code ? response.body.code : 'N/A')
          });
        } else {
          return ;
        }
      }
    },
    risk: async (_, {id}, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectRiskQuery(id, selectMap.getNode("risk"));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Risk",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const reducer = getReducer("RISK");
        let risk = response[0];

        // calculate the risk level
        risk.risk_level = 'unknown';
        if (risk.cvss2_base_score !== undefined || risk.cvss3_base_score !== undefined) {
          // calculate the risk level
          const {riskLevel, riskScore} = calculateRiskLevel(risk);
          risk.risk_score = riskScore;
          risk.risk_level = riskLevel;

          // clean up
          delete risk.cvss2_base_score;
          delete risk.cvss2_temporal_score;
          delete risk.cvss3_base_score
          delete risk.cvss3_temporal_score;
          delete risk.available_exploit;
          delete risk.exploitability_ease;
        }

        // retrieve most recent remediation state
        if (risk.remediation_type !== undefined) {
          const {responseType, lifeCycle} = getLatestRemediationInfo(risk);
          if (responseType !== undefined) risk.response_type = responseType;
          if (lifeCycle !== undefined) risk.lifecycle = lifeCycle;
          // clean up
          delete risk.remediation_response_date;
          delete risk.remediation_type;
          delete risk.remediation_lifecycle;
        }

        // calculate the occurrence count
        if (risk.related_observations !== undefined ) {
          risk.occurrences = risk.related_observations.length;
        } else { risk.occurrences = 0; }

        if (risk.risk_status == 'deviation_requested' || risk.risk_status == 'deviation_approved') {
          console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${risk.iri} invalid field value 'risk_status'; fixing`);
          risk.risk_status = risk.risk_status.replace('_', '-');
        }

        return reducer(risk);  
      } else {
        // Handle reporting Stardog Error
        if (typeof (response) === 'object' && 'body' in response) {
          throw new UserInputError(response.statusText, {
            error_details: (response.body.message ? response.body.message : response.body),
            error_code: (response.body.code ? response.body.code : 'N/A')
          });
        } else {
          return null;
        }
      }
    }
  },
  Mutation: {
    createRisk: async ( _, {poamId, resultId, input}, {dbName, selectMap, dataSources} ) => {
      // TODO: WORKAROUND to remove input fields with null or empty values so creation will work
      for (const [key, value] of Object.entries(input)) {
        if (Array.isArray(input[key]) && input[key].length === 0) {
          delete input[key];
          continue;
        }
        if (value === null || value.length === 0) {
          delete input[key];
        }
      }
      // END WORKAROUND

      // Ensure either the ID of either a POAM or a Assessment Result is supplied
      if (poamId === undefined && resultId === undefined) {
        // Default to the POAM
        poamId = '22f2ad37-4f07-5182-bf4e-59ea197a73dc';
      }

      // Setup to handle embedded objects to be created
      let origins;
      if (input.origins !== undefined) {
        origins = input.origins;
        delete input.origins;
      }

      // create the Risk
      const {iri, id, query} = insertRiskQuery(input);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: "Create Risk"
      });

      // attach the Risk to the supplied POAM
      if (poamId !== undefined && poamId !== null) {
        const attachQuery = attachToPOAMQuery(poamId, 'risks', iri );
        try {
          await dataSources.Stardog.create({
            dbName,
            queryId: "Add Risk to POAM",
            sparqlQuery: attachQuery
          });
        } catch (e) {
          console.log(e)
          throw e
        }
      }

      // create any origins supplied and attach them to the Risk
      if (origins !== undefined && origins !== null ) {
        // create the origin
        // attach origin ot the Risk
      }

      // retrieve information about the newly created Risk to return to the user
      const select = selectRiskQuery(id, selectMap.getNode("createRisk"));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: "Select Risk",
        singularizeSchema
      });
      const reducer = getReducer("RISK");
      return reducer(result[0]);
    },
    deleteRisk: async ( _, {poamId, _resultId, id}, {dbName, dataSources} ) => {
      // Ensure either the ID of either a POAM or a Assessment Result is supplied
      if (poamId === undefined && resultId === undefined) {
        // Default to the POAM
        poamId = '22f2ad37-4f07-5182-bf4e-59ea197a73dc';
      }

      // check that the risk exists
      const sparqlQuery = selectRiskQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Risk",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
      let reducer = getReducer("RISK");
      const risk = (reducer(response[0]));

      // Delete any attached origins
      if (risk.hasOwnProperty('origins_iri')) {
        for (const originIri of risk.origins_iri) {
          const originQuery = deleteOriginByIriQuery(originIri);
          try {
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: originQuery,
              queryId: "Delete Origin from Risk"
            });
          } catch (e) {
            console.log(e)
            throw e
          }    
        }
      }

      // Detach the Risk from the supplied POAM
      if (poamId !== undefined && poamId !== null) {
        const attachQuery = detachFromPOAMQuery(poamId, 'risks', risk.iri );
        try {
          await dataSources.Stardog.create({
            dbName,
            queryId: "Detaching Risk from POAM",
            sparqlQuery: attachQuery
          });
        } catch (e) {
          console.log(e)
          throw e
        }
      }

      // Delete the Risk itself
      const query = deleteRiskQuery(id);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: query,
          queryId: "Delete Risk"
        });
      } catch (e) {
        console.log(e)
        throw e
      }
      return id;
    },
    editRisk: async (_, {id, input}, {dbName, dataSources, selectMap}) => {
      // check that the object to be edited exists with the predicates - only get the minimum of data
      let editSelect = ['id'];
      for (let editItem of input) {
        editSelect.push(editItem.key);
      }
      const sparqlQuery = selectRiskQuery(id, editSelect );
      let response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Risk",
        singularizeSchema
      })
      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

      // TODO: WORKAROUND to handle UI where it DOES NOT provide an explicit operation
      for (let editItem of input) {
        if (!response[0].hasOwnProperty(editItem.key)) editItem.operation = 'add';
      }
      // END WORKAROUND

      // Handle 'dynamic' property editing separately
      for (let editItem of input) {
        let parentIri, iriTemplate, predicateMap;
        if (editItem.key === 'poam_id') {
          // remove edit item so it doesn't get processed again
          input = input.filter(item => item.key != 'poam_id');

          // find parent IRI of POAM Item 
          let parentQuery = findParentIriQuery(response[0].iri, editItem.key, riskPredicateMap);
          let results = await dataSources.Stardog.queryById({
            dbName,
            sparqlQuery: parentQuery,
            queryId: "Select Find Parent",
            singularizeSchema
          })
          if (results.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

          for (let result of results) {
            let index = result.objectType.indexOf('poam-item');
            parentIri = result.parentIri[index];
            iriTemplate = objectMap[result.objectType[index]].iriTemplate;
            predicateMap = objectMap[result.objectType[index]].predicateMap;
            break;
          }

          let newInput = [editItem];
          const query = updateQuery(
            parentIri,
            iriTemplate,
            newInput,
            predicateMap
          );
          response = await dataSources.Stardog.edit({
            dbName,
            sparqlQuery: query,
            queryId: "Update Risk"
          });
          if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
        }
      }

      if (input.length > 0 ) {
        const query = updateQuery(
          `http://csrc.nist.gov/ns/oscal/assessment/common#Risk-${id}`,
          "http://csrc.nist.gov/ns/oscal/assessment/common#Risk",
          input,
          riskPredicateMap
        )
        response = await dataSources.Stardog.edit({
          dbName,
          sparqlQuery: query,
          queryId: "Update Risk"
        });
        if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
      }

      const select = selectRiskQuery(id, selectMap.getNode("editRisk"));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: "Select Risk",
        singularizeSchema
      });
      const reducer = getReducer("RISK");
      return reducer(result[0]);
    },
  },
  // field-level resolvers
  Risk: {
    labels: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.labels_iri === undefined) return [];
      let iriArray = parent.labels_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getGlobalReducer("LABEL");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Label')) {
            continue;
          }
          const sparqlQuery = selectLabelByIriQuery(iri, selectMap.getNode("labels"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Label",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]))
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        return results;
      } else {
        return [];
      }
    },
    links: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.links_iri === undefined) return [];
      let iriArray = parent.links_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getGlobalReducer("EXTERNAL-REFERENCE");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('ExternalReference')) {
            continue;
          }
          const sparqlQuery = selectExternalReferenceByIriQuery(iri, selectMap.getNode("links"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Link",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]))
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        return results;
      } else {
        return [];
      }
    },
    remarks: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.remarks_iri === undefined) return [];
      let iriArray = parent.remarks_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getGlobalReducer("NOTE");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Note')) {
            continue;
          }
          const sparqlQuery = selectNoteByIriQuery(iri, selectMap.getNode("remarks"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Remark",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]))
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        return results;
      } else {
        return [];
      }
    },
    origins: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.origins_iri === undefined) return [];
      let iriArray = parent.origins_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer("ORIGIN");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Origin')) {
            continue;
          }
          const sparqlQuery = selectOriginByIriQuery(iri, selectMap.getNode("origins"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Origin",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]))
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        return results;
      } else {
        return [];
      }
    },
    threats: async (parent, _, ) => {
      if (parent.threats_iri === undefined) return [];
      // this is a No-Op for MVP until we get threat intelligence integrated 
      return [];
    },
    characterizations: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.characterizations_iri === undefined) return [];
      let iriArray = parent.characterizations_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer("CHARACTERIZATION");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Characterization')) {
            continue;
          }
          const sparqlQuery = selectCharacterizationByIriQuery(iri, selectMap.getNode('characterizations'));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Characterization",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]))
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        return results;
      } else {
        return [];
      }
    },
    mitigating_factors: async (parent, _, {dbName, dataSources, }) => {
      if (parent.mitigating_factors_iri === undefined) return [];
      let iriArray = parent.mitigating_factors_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer("MITIGATING-FACTOR");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('MitigatingFactor')) {
            continue;
          }
          const sparqlQuery = selectMitigatingFactorByIriQuery(iri, null);
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Mitigating Factor",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]))
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        return results;
      } else {
        return [];
      }
    },
    remediations: async (parent, _, {dbName, dataSources, }) => {
      if (parent.remediations_iri === undefined) return [];
      let iriArray = parent.remediations_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer("RISK-RESPONSE");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('RiskResponse')) {
            continue;
          }
          const sparqlQuery = selectRiskResponseByIriQuery(iri, null);
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select RiskResponse",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]))
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        return results;
      } else {
        return [];
      }
    },
    risk_log: async (parent, args, {dbName, dataSources, }) => {
      if (parent.risk_log_iri === undefined) return null;
      let iriArray = parent.risk_log_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const edges = [];
        const reducer = getReducer("RISK-LOG-ENTRY");
        let filterCount, resultCount, limit, offset, limitSize, offsetSize;
        limitSize = limit = (args.first === undefined ? iriArray.length : args.first) ;
        offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;
        filterCount = 0;
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('RiskLogEntry')) continue ;
          const sparqlQuery = selectRiskLogEntryByIriQuery(iri, null);
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Risk Log Entry",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return null;
          if (Array.isArray(response) && response.length > 0) {
            if ( limit ) {
              let edge = {
                cursor: iri,
                node: reducer(response[0]),
              }
              edges.push(edge);
              limit--;
              if (limit === 0) break;
            }
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        // check if there is data to be returned
        if (edges.length === 0 ) return null;
        let hasNextPage = false, hasPreviousPage = false;
        resultCount = iriArray.length;
        if (edges.length < resultCount) {
          if (edges.length === limitSize && filterCount <= limitSize ) {
            hasNextPage = true;
            if (offsetSize > 0) hasPreviousPage = true;
          }
          if (edges.length <= limitSize) {
            if (filterCount !== edges.length) hasNextPage = true;
            if (filterCount > 0 && offsetSize > 0) hasPreviousPage = true;
          }
        }
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (hasNextPage ),
            hasPreviousPage: (hasPreviousPage),
            globalCount: resultCount,
          },
          edges: edges,
        }
      } else {
        return null;
      }
    },
    related_observations: async (parent, args, {dbName, dataSources, }) => {
      if (parent.related_observations_iri === undefined) return null;
      let iriArray = parent.related_observations_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const edges = [];
        const reducer = getReducer("OBSERVATION");
        let filterCount, resultCount, limit, offset, limitSize, offsetSize;
        limitSize = limit = (args.first === undefined ? iriArray.length : args.first) ;
        offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;
        filterCount = 0;
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Observation')) continue ;
          const sparqlQuery = selectObservationByIriQuery(iri, null);
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Observation",
              singularizeSchema
            });
          } catch (e) {
            console.log(e)
            throw e
          }
          if (response === undefined) return null;
          if (Array.isArray(response) && response.length > 0) {
            if ( limit ) {
              let edge = {
                cursor: iri,
                node: reducer(response[0]),
              }
              edges.push(edge);
              limit--;
              if (limit === 0) break;
            }
          }
          else {
            // Handle reporting Stardog Error
            if (typeof (response) === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: (response.body.message ? response.body.message : response.body),
                error_code: (response.body.code ? response.body.code : 'N/A')
              });
            }
          }  
        }
        // check if there is data to be returned
        if (edges.length === 0 ) return null;
        let hasNextPage = false, hasPreviousPage = false;
        resultCount = iriArray.length;
        if (edges.length < resultCount) {
          if (edges.length === limitSize && filterCount <= limitSize ) {
            hasNextPage = true;
            if (offsetSize > 0) hasPreviousPage = true;
          }
          if (edges.length <= limitSize) {
            if (filterCount !== edges.length) hasNextPage = true;
            if (filterCount > 0 && offsetSize > 0) hasPreviousPage = true;
          }
        }
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (hasNextPage ),
            hasPreviousPage: (hasPreviousPage),
            globalCount: resultCount,
          },
          edges: edges,
        }
      } else {
        return null;
      }
    },
    occurrences: async (parent, _, {dbName, dataSources, }) => {
      if (parent.id === undefined) {
        return 0;
      }

      // return occurrences value from parent if already exists
      if (parent.hasOwnProperty('occurrences')) return parent.occurrences;

      const id = parent.id
      const iri = `<http://csrc.nist.gov/ns/oscal/assessment/common#Risk-${id}>`
      const sparqlQuery = `
      SELECT DISTINCT (COUNT(?related_observations) as ?occurrences)
      FROM <tag:stardog:api:context:local>
      WHERE {
        ${iri} <http://csrc.nist.gov/ns/oscal/assessment/common#related_observations> ?related_observations .
      }
      `;
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select occurrence count",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }
      if (response === undefined) {
        return 0;
      }
      if (Array.isArray(response) && response.length > 0) {
        return( response[0].occurrences)
      } else {
        // Handle reporting Stardog Error
        if (typeof (response) === 'object' && 'body' in response) {
          throw new UserInputError(response.statusText, {
            error_details: (response.body.message ? response.body.message : response.body),
            error_code: (response.body.code ? response.body.code : 'N/A')
          });
        } else {
          return null;
        }
      }
    }
  }
}

export default riskResolvers;
