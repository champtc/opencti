import { UserInputError } from 'apollo-server-express';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { 
  findAllOrigins,
  findOriginById,
  createOrigin,
  deleteOriginById,
  editOriginById,
  attachToOrigin,
  detachFromOrigin,
 } from '../domain/origin.js';
import {
  getReducer,
  selectActorByIriQuery,
} from './sparql-query.js';

const originResolvers = {
  Query: {
    origins: async (_, args, { dbName, dataSources, selectMap }) => findAllOrigins(args, dbName, dataSources, selectMap.getNode('node')),
    origin: async (_, { id }, { dbName, dataSources, selectMap }) => findOriginById(id, dbName, dataSources, selectMap.getNode('origin')),
  },
  Mutation: {
    createOrigin: async (_, { input }, { dbName, selectMap, dataSources }) => createOrigin(input, dbName, dataSources, selectMap.getNode("createOrigin")),
    deleteOrigin: async (_, { id }, { dbName, dataSources }) => deleteOriginById( id, dbName, dataSources),
    editOrigin: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editOriginById(id, input, dbName, dataSources, selectMap.getNode("editOrigin"), schema),
    attachToOrigin: async (_, { id, field, entryId }, { dbName, dataSources }) => attachToOrigin(id, field, entryId ,dbName, dataSources),
    detachFromOrigin: async (_, { id, field, entryId }, { dbName, dataSources }) => detachFromOrigin(id, field, entryId ,dbName, dataSources),
  },
  Origin: {
    origin_actors: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.origin_actors_iri === undefined) return [];
      const iriArray = parent.origin_actors_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer('ACTOR');
        for (const iri of iriArray) {
          if (iri === undefined || !iri.includes('Actor')) {
            continue;
          }
          const sparqlQuery = selectActorByIriQuery(iri, selectMap.getNode('origin_actors'));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Select Actor',
              singularizeSchema,
            });
          } catch (e) {
            console.log(e);
            throw e;
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            // TODO: fix the generation to use the assessment-platform  as the actor type value of Assessment Platforms
            if (
              response[0].actor_type !== undefined &&
              response[0].actor_type == 'tool' &&
              response[0].actor_ref !== undefined &&
              response[0].actor_ref.includes('AssessmentPlatform')
            ) {
              response[0].actor_type = 'assessment-platform';
            }
            results.push(reducer(response[0]));
          } else {
            // Handle reporting Stardog Error
            if (typeof response === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: response.body.message ? response.body.message : response.body,
                error_code: response.body.code ? response.body.code : 'N/A',
              });
            }
          }
        }
        return results;
      }
      return [];
    },
    related_tasks: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.related_tasks_iri === undefined) return [];
      const iriArray = parent.related_tasks_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer('TASK');
        for (const iri of iriArray) {
          if (iri === undefined || !iri.includes('Task')) {
            continue;
          }
          const sparqlQuery = selectOscalTaskByIriQuery(iri, selectMap.getNode('related_tasks'));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Select Task',
              singularizeSchema,
            });
          } catch (e) {
            console.log(e);
            throw e;
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]));
          } else {
            // Handle reporting Stardog Error
            if (typeof response === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: response.body.message ? response.body.message : response.body,
                error_code: response.body.code ? response.body.code : 'N/A',
              });
            }
          }
        }
        return results;
      }
      return [];
    },
  },
};

export default originResolvers;
