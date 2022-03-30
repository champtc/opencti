import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import {compareValues, updateQuery, filterValues} from '../../../utils.js';
import {UserInputError} from "apollo-server-express";
import {
  getReducer, 
  insertPOAMQuery,
  selectPOAMQuery,
  selectAllPOAMs,
  deletePOAMQuery,
  selectPOAMItemByIriQuery,
  attachToPOAMQuery,
  detachFromPOAMQuery,
  poamPredicateMap,
} from './sparql-query.js';
import {
  selectLabelByIriQuery,
  selectExternalReferenceByIriQuery,
  selectNoteByIriQuery,
  getReducer as getGlobalReducer,
} from '../../../global/resolvers/sparql-query.js';
import {
  getReducer as getAssessmentReducer,
  selectObservationByIriQuery,
  selectRiskByIriQuery,
} from '../../assessment-common/resolvers/sparql-query.js';
import {
  insertRolesQuery,
  selectRoleByIriQuery,
  getReducer as getCommonReducer,
} from '../../oscal-common/resolvers/sparql-query.js';

const poamResolvers = {
  Query: {
    poams: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllPOAMs(selectMap.getNode("node"), args.filters);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: "Select POAM List",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer("POAM");
        let limit = (args.first === undefined ? response.length : args.first) ;
        let offset = (args.offset === undefined ? 0 : args.offset) ;
        let poamList ;
        if (args.orderedBy !== undefined ) {
          poamList = response.sort(compareValues(args.orderedBy, args.orderMode ));
        } else {
          poamList = response;
        }

        if (offset > poamList.length) return null;

        // for each POAM in the result set
        for (let poam of poamList) {
          // skip down past the offset
          if (offset) {
            offset--
            continue
          }

          // if (poam.id === undefined || poam.id == null ) {
          //   console.log(`[DATA-ERROR] object ${poam.iri} is missing required properties; skipping object.`);
          //   continue;
          // }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(poam, args.filters, args.filterMode) ) {
              continue
            }
          }

          // if haven't reached limit to be returned
          if (limit) {
            let edge = {
              cursor: poam.iri,
              node: reducer(poam),
            }
            edges.push(edge)
            limit--;
          }
        }
        if (edges.length === 0 ) return null;
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (args.first > poamList.length),
            hasPreviousPage: (args.offset > 0),
            globalCount: poamList.length,
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
    poam: async (_, {id}, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectPOAMQuery(id, selectMap.getNode("poam"));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select POAM",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const reducer = getReducer("POAM");
        return reducer(response[0]);  
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
    createPOAM: async ( _, {input}, {dbName, selectMap, dataSources} ) => {
      // Setup to handle embedded objects to be created
      let roles, locations, parties, responsibleParties;
      if (input.roles !== undefined) {
        roles = input.roles;
        delete input.roles;
      }
      if (input.locations !== undefined) {
        locations = input.locations;
        delete input.locations;
      }
      if (input.parties !== undefined) {
        parties = input.parties;
        delete input.parties;
      }
      if (input.responsible_parties !== undefined) {
        responsibleParties = input.responsible_parties;
        delete input.responsible_parties;
      }

      // Create the POAM
      const {id, query} = insertPOAMQuery(input);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: "Create POAM"
      });

      // create any roles supplied and attach them to the POAM
      if (roles !== undefined && roles !== null ) {
        // create the roles
        const { roleIris, query } = insertRolesQuery( roles );
        try {
          await dataSources.Stardog.create({
            dbName,
            sparqlQuery: query,
            queryId: "Create Roles for the POAM"
          });
        } catch (e) {
          console.log(e)
          throw e
        }

        // attach roles to the POAM
        const roleAttachQuery = attachToPOAMQuery(id, 'roles', roleIris );
        try {
          await dataSources.Stardog.create({
            dbName,
            queryId: "Add role to POAM",
            sparqlQuery: roleAttachQuery
          });
        } catch (e) {
          console.log(e)
          throw e
        }        
      }

      // TODO: create any location supplied and attach them to the POAM
      if (locations !== undefined && locations !== null ) {
          // create the locations
          // attach locations to the POAM
      }
      // TODO: create any parties supplied and attach them to the POAM
      if (parties !== undefined && parties !== null ) {
        // create the parties
        // attach parties to the POAM
      }
      // TODO: create any responsible parties supplied and attach them to the POAM
      if (responsibleParties !== undefined && responsibleParties !== null ) {
        // create the responsible parties
        // attach responsible parties to the POAM
      }

      // retrieve information about the newly created POAM to return to the user
      const select = selectPOAMQuery(id, selectMap.getNode("createPOAM"));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: "Select POAM",
        singularizeSchema
      });
      const reducer = getReducer("POAM");
      return reducer(result[0]);
    },
    deletePOAM: async ( _, {id}, {dbName, dataSources} ) => {
      // check that the risk exists
      const sparqlQuery = selectPOAMQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select POAM",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
      const reducer = getReducer("POAM");
      poam = (reducer(response[0]));

      // Detach any attached roles
      if (poam.hasOwnProperty('roles_iri')) {
        for (const roleIri of poam.roles_iri) {
          const roleQuery = detachFromPOAMQuery(id, 'roles', roleIri);
          try {
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: roleQuery,
              queryId: "Detach Role from POAM"
            });
          } catch (e) {
            console.log(e)
            throw e
          }    
        }
      }

      const query = deletePOAMQuery(id);
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: query,
        queryId: "Delete POAM"
      });
      return id;
    },
    editPOAM: async (_, {id, input}, {dbName, dataSources, selectMap}) => {
      // check that the risk exists
      const sparqlQuery = selectPOAMQuery(id, null);
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
      const query = updateQuery(
        `http://csrc.nist.gov/ns/oscal/common#POAM-${id}`,
        "http://csrc.nist.gov/ns/oscal/common#POAM",
        input,
        poamPredicateMap
      )
      await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update POAM"
      });
      const select = selectPOAMQuery(id, selectMap.getNode("editPOAM"));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: "Select POAM",
        singularizeSchema
      });
      const reducer = getReducer("POAM");
      return reducer(result[0]);
    },
  },
  // field-level resolvers
  POAM: {
    labels: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.labels_iri === undefined) return [];
      let iriArray = parent.labels_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getGlobalReducer("LABEL");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Label')) continue;
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
    links: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.ext_ref_iri === undefined) return [];
      let iriArray = parent.ext_ref_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getGlobalReducer("EXTERNAL-REFERENCE");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('ExternalReference')) continue;
          const sparqlQuery = selectExternalReferenceByIriQuery(iri, selectMap.getNode("external_references"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select External Reference",
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
    remarks: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.notes_iri === undefined) return [];
      let iriArray = parent.notes_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getGlobalReducer("NOTE");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Note')) continue;
          const sparqlQuery = selectNoteByIriQuery(iri, selectMap.getNode("notes"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Note",
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
    revisions: async (parent, args, {dbName, dataSources, selectMap}) => {
      // TODO: Add implementation retrieval of revisions
    },
    roles: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.roles_iri === undefined) return null;
      let iriArray = parent.roles_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const edges = [];
        const reducer = getCommonReducer("ROLE");
        let limit = (args.first === undefined ? iriArray.length : args.first) ;
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Role')) continue ;
          const sparqlQuery = selectRoleByIriQuery(iri, selectMap.getNode('node'));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Role",
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
        if (edges.length === 0 ) return null;
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (iriArray.length > args.first ),
            hasPreviousPage: 0,
            globalCount: iriArray.length,
          },
          edges: edges,
        }
      } else {
        return null;
      }
    },
    locations: async (parent, args, {dbName, dataSources, selectMap}) => {
      // TODO: Add implementation retrieval of locations
    },
    parties: async (parent, args, {dbName, dataSources, selectMap}) => {
      // TODO: Add implementation party retrieval
    },
    responsible_parties: async (parent, args, {dbName, dataSources, selectMap}) => {
      // TODO: Add implementation responsible parties retrieval
    },
    local_definitions: async (parent, args, {dbName, dataSources, selectMap}) => {
      // TODO: Add implementation location definition retrieval
    },
    observations: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.observations_iri === undefined) return null;
      let iriArray = parent.observations_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const edges = [];
        const reducer = getAssessmentReducer("OBSERVATION");
        let limit = (args.first === undefined ? iriArray.length : args.first) ;
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
        if (edges.length === 0 ) return null;
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (iriArray.length > args.first ),
            hasPreviousPage: 0,
            globalCount: iriArray.length,
          },
          edges: edges,
        }
      } else {
        return null;
      }
    },
    risks: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.risks_iri === undefined) return null;
      let iriArray = parent.risks_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const edges = [];
        const reducer = getAssessmentReducer("RISK");
        let limit = (args.first === undefined ? iriArray.length : args.first) ;
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Risk')) continue ;
          const sparqlQuery = selectRiskByIriQuery(iri, null);
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
            if ( limit ) {
              let edge = {
                cursor: iri,
                node: reducer(response[0]),
              }
              edges.push(edge);
              limit--;
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
        if (edges.length === 0 ) return null;
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (iriArray.length > args.first ),
            hasPreviousPage: 0,
            globalCount: iriArray.length,
          },
          edges: edges,
        }
      } else {
        return null;
      }
    },
    poam_items: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.poam_items_iri === undefined) return null;
      let iriArray = parent.poam_items_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const edges = [];
        const reducer = getReducer("POAM-ITEM");
        let limit = (args.first === undefined ? iriArray.length : args.first) ;
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('poam#Item')) continue ;
          const sparqlQuery = selectPOAMItemByIriQuery(iri, null);
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select POAM Item",
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
        if (edges.length === 0 ) return null;
        return {
          pageInfo: {
            startCursor: edges[0].cursor,
            endCursor: edges[edges.length-1].cursor,
            hasNextPage: (iriArray.length > args.first ),
            hasPreviousPage: 0,
            globalCount: iriArray.length,
          },
          edges: edges,
        }
      } else {
        return null;
      }
    },
    resources: async (parent, args, {dbName, dataSources, selectMap}) => {
      // TODO: Add implementation resource retrieval
    },
  }
}

export default poamResolvers;