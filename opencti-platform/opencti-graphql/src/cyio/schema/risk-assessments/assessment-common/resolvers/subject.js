import {riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import {objectMap, selectObjectIriByIdQuery, selectObjectByIriQuery} from '../../../global/global-utils.js';
import {compareValues, updateQuery, filterValues} from '../../../utils.js';
import {UserInputError} from "apollo-server-express";
import {
  selectExternalReferenceByIriQuery,
  selectNoteByIriQuery,
  getReducer as getGlobalReducer,
} from '../../../global/resolvers/sparql-query.js';
import { 
  getReducer as getCommonReducer,
  // selectObjectByIriQuery,
} from '../../oscal-common/resolvers/sparql-query.js';
import {
  getReducer, 
  selectAllSubjects,
  deleteSubjectQuery,
  deleteSubjectByIriQuery,
  insertSubjectQuery,
  selectSubjectQuery,
  selectSubjectByIriQuery,
  attachToSubjectQuery,
  detachFromSubjectQuery,
  subjectPredicateMap,
  getSubjectIriByIdQuery,
  insertSubjectsQuery,
} from './sparql-query.js';


const subjectResolvers = {
  Query: {
    subjects: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllSubjects(selectMap.getNode("node"), args.filters);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: "Select Subject List",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer("SUBJECT");
        let limit = (args.first === undefined ? response.length : args.first) ;
        let offset = (args.offset === undefined ? 0 : args.offset) ;
        let subjectList ;
        if (args.orderedBy !== undefined ) {
          subjectList = response.sort(compareValues(args.orderedBy, args.orderMode ));
        } else {
          subjectList = response;
        }

        if (offset > subjectList.length) return null;

        // for each Subject in the result set
        for (let subject of subjectList) {
          // skip down past the offset
          if (offset) {
            offset--
            continue
          }

          if (subject.id === undefined || subject.id == null || subject.subject_ref == undefined) {
            console.log(`[DATA-ERROR] object ${subject.iri} is missing required properties; skipping object.`);
            continue;
          }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(subject, args.filters, args.filterMode) ) {
              continue
            }
          }

          // if haven't reached limit to be returned
          if (limit) {
            let edge = {
              cursor: subject.iri,
              node: reducer(subject),
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
            hasNextPage: (args.first > subjectList.length),
            hasPreviousPage: (args.offset > 0),
            globalCount: subjectList.length,
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
          return null;
        }
      }
    },
    subject: async (_, {id}, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectSubjectQuery(id, selectMap.getNode("subject"));
      let response;
      try {
          response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Subject",
          singularizeSchema
          });
      } catch (e) {
          console.log(e)
          throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
          const reducer = getReducer("SUBJECT");
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
    },
    assessmentSubjects: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllAssessmentSubjects(selectMap.getNode("node"), args.filters);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: "Select Assessment Subject List",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer("ASSESSMENT-SUBJECT");
        let limit = (args.first === undefined ? response.length : args.first) ;
        let offset = (args.offset === undefined ? 0 : args.offset) ;
        let subjectList ;
        if (args.orderedBy !== undefined ) {
          subjectList = response.sort(compareValues(args.orderedBy, args.orderMode ));
        } else {
          subjectList = response;
        }

        if (offset > subjectList.length) return null;

        // for each Subject in the result set
        for (let subject of subjectList) {
          // skip down past the offset
          if (offset) {
            offset--
            continue
          }

          if (subject.id === undefined || subject.id == null ) {
            console.log(`[DATA-ERROR] object ${subject.iri} is missing required properties; skipping object.`);
            continue;
          }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(subject, args.filters, args.filterMode) ) {
              continue
            }
          }

          // if haven't reached limit to be returned
          if (limit) {
            let edge = {
              cursor: subject.iri,
              node: reducer(subject),
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
            hasNextPage: (args.first > subjectList.length),
            hasPreviousPage: (args.offset > 0),
            globalCount: subjectList.length,
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
          return null;
        }
      }
    },
    assessmentSubject: async (_, {id}, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAssessmentSubjectQuery(id, selectMap.getNode("assessmentSubject"));
      let response;
      try {
          response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Assessment Subject",
          singularizeSchema
          });
      } catch (e) {
          console.log(e)
          throw e
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
          const reducer = getReducer("ASSESSMENT-SUBJECT");
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
    },
  },
  Mutation: {
    createSubject: async ( _, {input}, {dbName, selectMap, dataSources} ) => {
      // convert subject_uuid to IRI
      let result;
      // determine the actual IRI of the object referenced
      let sparqlQuery = selectObjectIriByIdQuery( input.subject_ref, input.subject_type );
      try {
        result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Subject target",
        singularizeSchema
        });
      } catch (e) {
          console.log(e)
          throw e
      }
      if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${input.subject_ref}`);
      input.subject_ref = result[0].iri;

      // create the Subject
      const {id, query} = insertSubjectQuery(input);
      try {
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: "Create Subject"
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      // retrieve information about the newly created Characterization to return to the user
      const select = selectSubjectQuery(id, selectMap.getNode("createSubject"));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: "Select Subject",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }
      const reducer = getReducer("SUBJECT");
      return reducer(response[0]);
    },
    deleteSubject: async ( _, {id}, {dbName, dataSources} ) => {
      // check that the Subject exists
      const sparqlQuery = selectSubjectQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Subject",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
      let reducer = getReducer("SUBJECT");
      const subject = (reducer(response[0]));
      
      // Detach any attached subject targets
      if (subject.hasOwnProperty('subject_ref_iri')) {
        const subjectIri = subject.subject_ref_iri;
        const subjectQuery = detachFromSubjectQuery(id, 'subject', subjectIri);
        try {
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: subjectQuery,
            queryId: "Detaching subject target from Subject"
          });
        } catch (e) {
          console.log(e)
          throw e
        }    
      }

      // Delete the Subject itself
      const query = deleteSubjectQuery(id);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: query,
          queryId: "Delete Subject"
        });
      } catch (e) {
        console.log(e)
        throw e
      }
      return id;
    },
    editSubject: async (_, {id, input}, {dbName, dataSources, selectMap}) => {
      // check that the risk response exists
      const sparqlQuery = selectSubjectQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Subject",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
      const query = updateQuery(
        `http://csrc.nist.gov/ns/oscal/assessment/common#Subject-${id}`,
        "http://csrc.nist.gov/ns/oscal/assessment/common#Subject",
        input,
        subjectPredicateMap
      )
      await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Subject"
      });
      const select = selectSubjectQuery(id, selectMap.getNode("editSubject"));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: "Select Subject",
        singularizeSchema
      });
      const reducer = getReducer("SUBJECT");
      return reducer(result[0]);
    },
    createAssessmentSubject: async ( _, {input}, {dbName, selectMap, dataSources} ) => {
      if (input.include_all !== undefined && input.include_subjects !== undefined) {
        throw new UserInputError(`Can not specify both 'include_all' and 'include_subjects'`);
      }

      // Setup to handle embedded objects to be created
      let includes, excludes;
      if (input.include_subjects !== undefined) {
        includes = input.include_subjects;
        delete input.include_subjects;
      }
      if (input.exclude_subjects !== undefined) {
        excludes = input.exclude_subjects;
        delete input.exclude_subjects;
      }

      // create the Assessment Subject
      const {id, query} = insertAssessmentSubjectQuery(input);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: "Create Assessment Subject"
      });

      // Add the Subjects to be included to the Assessment Subject
      if (includes !== undefined && includes !== null ) {
        // Create the Subject
        const { includeIris, query } = insertSubjectsQuery( includes );
        try {
          await dataSources.Stardog.create({
            dbName,
            sparqlQuery: query,
            queryId: "Create Subjects of AssessmentSubject"
          });
        } catch (e) {
          console.log(e)
          throw e
        }

        // Attach the Subject to the Assessment Subject include list
        const includeAttachQuery = attachToAssessmentSubjectQuery(id, 'include_subjects', includeIris );
        try {
          await dataSources.Stardog.create({
            dbName,
            queryId: "Add Subjects to AssessmentSubject",
            sparqlQuery: includeAttachQuery
          });
        } catch (e) {
          console.log(e)
          throw e
        }
      }
      // Add the Subjects to be excluded to the Assessment Subject
      if (excludes !== undefined && excludes !== null ) {
        // Create the Subject
        const { excludeIris, query } = insertSubjectsQuery( excludes );
        try {
          await dataSources.Stardog.create({
            dbName,
            sparqlQuery: query,
            queryId: "Create Subjects of AssessmentSubject"
          });
        } catch (e) {
          console.log(e)
          throw e
        }

        // Attach the Subject to the Assessment Subject exclude list
        const includeAttachQuery = attachToAssessmentSubjectQuery(id, 'exclude_subjects', excludeIris );
        try {
          await dataSources.Stardog.create({
            dbName,
            queryId: "Add facet to Characterization",
            sparqlQuery: includeAttachQuery
          });
        } catch (e) {
          console.log(e)
          throw e
        }
      }

      // retrieve information about the newly created Assessment to return to the caller
      const select = selectAssessmentSubjectQuery(id, selectMap.getNode("createAssessmentSubject"));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: "Select Assessment Subject",
        singularizeSchema
      });
      const reducer = getReducer("ASSESSMENT-SUBJECT");
      return reducer(result[0]);
    },
    deleteAssessmentSubject: async ( _, {id}, {dbName, dataSources} ) => {
      // check that the AssessmentSubject exists
      const sparqlQuery = selectAssessmentSubjectQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select AssessmentSubject",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
      let reducer = getReducer("ASSESSMENT-SUBJECT");
      const subject = (reducer(response[0]));
      
      // Delete any attached Subjects included
      if (subject.include_subjects_iri !== undefined && subject.include_subjects_iri != null) {
        for (let subjectIri of subject.include_subjects_iri ) {
          let subQuery = deleteSubjectByIriQuery( subjectIri );
          try {
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: subQuery,
              queryId: "Delete included Subject from AssessmentSubject"
            });
          } catch (e) {
            console.log(e)
            throw e
          }    
        }
      }
      // Delete any attached Subjects excluded
      if (subject.exclude_subjects_iri !== undefined && subject.exclude_subjects_iri != null) {
        for (let subjectIri of subject.exclude_subjects_iri ) {
          let subQuery = deleteSubjectByIriQuery( subjectIri );
          try {
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: subQuery,
              queryId: "Delete excluded Subject from AssessmentSubject"
            });
          } catch (e) {
            console.log(e)
            throw e
          }    
        }
      }

      // Delete the Subject itself
      const query = deleteAssessmentSubjectQuery(id);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: query,
          queryId: "Delete Assessment Subject"
        });
      } catch (e) {
        console.log(e)
        throw e
      }
      return id;
    },
    editAssessmentSubject: async (_, {id, input}, {dbName, dataSources, selectMap}) => {
      // check that the risk response exists
      const sparqlQuery = selectAssessmentSubjectQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Assessment Subject",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }

      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);
      const query = updateQuery(
        `http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentSubject-${id}`,
        "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentSubject",
        input,
        subjectPredicateMap
      )
      await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update AssessmentSubject"
      });
      const select = selectSubjectQuery(id, selectMap.getNode("editAssessmentSubject"));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: "Select AssessmentSubject",
        singularizeSchema
      });
      const reducer = getReducer("ASSESSMENT-SUBJECT");
      return reducer(result[0]);
    },
  },
  Subject: {
    links: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.ext_ref_iri === undefined) return [];
      let iriArray = parent.ext_ref_iri;
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
    remarks: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.notes_iri === undefined) return [];
      let iriArray = parent.notes_iri;
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
    subject_ref: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.subject_ref_iri === undefined) return null;
      let iri = parent.subject_ref_iri[0];
      const sparqlQuery = selectObjectByIriQuery(iri, parent.subject_type, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Select Object",
          singularizeSchema
        });
      } catch (e) {
        console.log(e)
        throw e
      }
      if (response === undefined || response.length === 0) return null;
      if (Array.isArray(response) && response.length > 0) {
        let reducer = getCommonReducer(parent.subject_type.toUpperCase());
        return (reducer(response[0]))
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
    },    
  },
  AssessmentSubject: {
    links: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.ext_ref_iri === undefined) return [];
      let iriArray = parent.ext_ref_iri;
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
    remarks: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.notes_iri === undefined) return [];
      let iriArray = parent.notes_iri;
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
    include_subjects: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.include_subjects_iri === undefined) return [];
      let iriArray = parent.include_subjects_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer("SUBJECT");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Subject')) {
            continue;
          }
          const sparqlQuery = selectSubjectByIriQuery(iri, selectMap.getNode("include_subjects"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Subject",
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
    exclude_subjects: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.exclude_subjects_iri === undefined) return [];
      let iriArray = parent.exclude_subjects_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer("SUBJECT");
        for (let iri of iriArray) {
          if (iri === undefined || !iri.includes('Subject')) {
            continue;
          }
          const sparqlQuery = selectSubjectByIriQuery(iri, selectMap.getNode("include_subjects"));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: "Select Subject",
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
  },
  SubjectTarget: {
    __resolveType: (item) => {
      return objectMap[item.entity_type].graphQLType;
    }
  }
}

export default subjectResolvers;