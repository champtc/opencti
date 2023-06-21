import { UserInputError } from 'apollo-server-errors';
import {logApp } from '../../../../../config/conf.js';
import { selectObjectIriByIdQuery } from '../../../global/global-utils.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  CyioError,
  checkIfValidUUID, 
} from '../../../utils.js';
import {
  getReducer,
  getOriginIri,
  originPredicateMap,
  singularizeOriginSchema,
  selectOriginQuery,
  selectOriginByIriQuery,
  selectAllOrigins,
  insertOriginQuery,
  deleteOriginQuery,
  deleteOriginByIriQuery,
  attachToOriginQuery,
  detachFromOriginQuery,
} from '../schema/sparql/origin.js';
import {
  insertActorsQuery,
  deleteActorByIriQuery,
} from '../resolvers/sparql-query.js';

// Origin
export const findOriginById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  const iri = getOriginIri(id);
  return findOriginByIri(iri, dbName, dataSources, select);
}
  
export const findOriginByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectOriginByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Origin",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;

  if (Array.isArray(response) && response.length > 0) {
    const reducer = getReducer('ORIGIN');
    return reducer(response[0]);
  }
  // Handle reporting Stardog Error
  if (typeof response === 'object' && 'body' in response) {
    throw new UserInputError(response.statusText, {
      error_details: response.body.message ? response.body.message : response.body,
      error_code: response.body.code ? response.body.code : 'N/A',
    });
  } else {
    return null;
  }  
};

export const findAllOrigins = async (args, dbName, dataSources, select ) => {
  const sparqlQuery = selectAllOrigins(select, args);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Origin",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  if (Array.isArray(response) && response.length > 0) {
    const edges = [];
    const reducer = getReducer("ORIGIN");
    let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
    limitSize = limit = (args.first === undefined ? response.length : args.first) ;
    offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;
  
    let originList;
    if (args.orderedBy !== undefined ) {
      originList = response.sort(compareValues(args.orderedBy, args.orderMode ));
    } else {
      originList = response;
    }
  
    // return null if offset value beyond number of results items
    if (offset > originList.length) return null;
  
    // for each result in the result set
    for (let origin of originList) {
      if (origin.id === undefined) {
        console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${origin.iri} missing field 'id'; skipping`);
        skipCount++;
        continue;
      }
  
      // skip down past the offset
      if (offset) {
        offset--
        continue
      }
  
      // filter out non-matching entries if a filter is to be applied
      if ('filters' in args && args.filters != null && args.filters.length > 0) {
        if (!filterValues(origin, args.filters, args.filterMode) ) {
          continue
        }
        filterCount++;
      }
  
      // if haven't reached limit to be returned
      if (limit) {
        let edge = {
          cursor: origin.iri,
          node: reducer(origin),
        }
        edges.push(edge)
        limit--;
        if (limit === 0) break;
      }
    }
    // check if there is data to be returned
    if (edges.length === 0 ) return null;
    let hasNextPage = false, hasPreviousPage = false;
    resultCount = originList.length - skipCount;
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
  
  }
  
  // Handle reporting Stardog Error
  if (typeof response === 'object' && 'body' in response) {
    throw new UserInputError(response.statusText, {
      error_details: response.body.message ? response.body.message : response.body,
      error_code: response.body.code ? response.body.code : 'N/A',
    });
  } else {
    return null;
  }
};

export const createOrigin = async (input, dbName, dataSources, select) => {
  // Setup to handle embedded objects to be created
  let tasks;
  let actors;
  if (input.origin_actors !== undefined) {
    if (input.origin_actors.length === 0) throw new CyioError(`No origin of the Risk Response provided.`);
    actors = input.origin_actors;
  }

  if (input.related_tasks !== undefined && input.related_tasks !== null) {
    // attempt to convert task's id to IRI
    let sparqlQuery;
    let result;
    const taskIris = [];
    for (const taskId of input.related_tasks) {
      sparqlQuery = selectObjectIriByIdQuery(taskId, 'task');
      try {
        result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Task',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (result === undefined || result.length === 0)
        throw new CyioError(`Entity does not exist with ID ${taskId}`);
      taskIris.push(result[0].iri);
    }
    if (taskIris.length > 0) input.related_tasks = taskIris;
  }

  // create any Actors supplied and attach them to the Origin
  let sparqlQuery;
  let result;
  for (const actor of actors) {
    // check to see if the referenced actor exists and get its IRI
    sparqlQuery = selectObjectIriByIdQuery(actor.actor_ref, actor.actor_type);
    try {
      result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Object',
        singularizeSchema,
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
    if (result == undefined || result.length === 0)
      throw new CyioError(`Entity does not exist with ID ${actor.actor_ref}`);
    actor.actor_ref = result[0].iri;

    // if a role reference was provided
    if (actor.role_ref !== undefined) {
      // check if the role reference exists and get its IRI
      sparqlQuery = selectObjectIriByIdQuery(actor.role_ref, 'role');
      try {
        result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Object',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (result == undefined || result.length === 0)
        throw new CyioError(`Entity does not exist with ID ${actor.role_ref}`);
      actor.role_ref = result[0].iri;
    }
  }

  // create the Origin object
  let response;
  let {iri, id, query} = insertOriginQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Origin object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (actors.length > 0) {
    // create the Actors
    const { actorIris, query } = insertActorsQuery(actors);
    try {
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: 'Create Actor of Origin',
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
    // attach Actor to the Origin
    const actorAttachQuery = attachToOriginQuery(id, 'origin_actors', actorIris);
    try {
      await dataSources.Stardog.create({
        dbName,
        queryId: 'Add Actor to Origin',
        sparqlQuery: actorAttachQuery,
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
  
  // retrieve the newly created Origin to be returned
  const selectQuery = selectOriginQuery(id, select);
  let originResult;
  try {
    originResult = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Origin object",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (originResult === undefined || originResult === null || originResult.length === 0) return null;
  const reducer = getReducer("ORIGIN");
  return reducer(originResult[0]);
};

export const deleteOriginById = async ( id, dbName, dataSources) => {
  let select = ['iri','id'];
  let idArray = [];
  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  let removedIds = []
  for (let itemId of idArray) {
    let response;
    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`);  

    // check if object with id exists
    let sparqlQuery = selectOriginQuery(itemId, select);
    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Origin",
        singularizeSchema: singularizeOriginSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);
    
    const reducer = getReducer('ORIGIN');
    const origin = reducer(response[0]);

    // Delete any attached Actors
    if (origin.hasOwnProperty('origin_actors_iri')) {
      for (const actorIri of origin.origin_actors_iri) {
        const actorQuery = deleteActorByIriQuery(actorIri);
        try {
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: actorQuery,
            queryId: 'Delete Actor from Origin',
          });
        } catch (e) {
          console.log(e);
          throw e;
        }
      }
    }

    // Detach any related tasks
    if (origin.hasOwnProperty('related_tasks_iri')) {
      const taskQuery = detachFromOriginQuery(id, 'related_tasks', origin.related_tasks_iri);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: taskQuery,
          queryId: 'Delete Related Tasks from Origin',
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
    }

    // Delete the Origin itself
    sparqlQuery = deleteOriginQuery(itemId);
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Origin"
      });
    } catch (e) {
      console.log(e)
      throw e
    }
    
    removedIds.push(itemId);
  }

  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteOriginByIri = async ( iri, dbName, dataSources) => {
  // check if object with iri exists
  let select = ['iri','id'];
  let response;
  try {
    let sparqlQuery = selectOriginByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Origin",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`);

  const reducer = getReducer('ORIGIN');
  const origin = reducer(response[0]);

  // Delete any attached Actors
  if (origin.hasOwnProperty('origin_actors_iri')) {
    for (const actorIri of origin.origin_actors_iri) {
      const actorQuery = deleteActorByIriQuery(actorIri);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: actorQuery,
          queryId: 'Delete Actor from Origin',
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
    }
  }

  // Detach any related tasks
  if (origin.hasOwnProperty('related_tasks_iri')) {
    const taskQuery = detachFromOriginQuery(id, 'related_tasks', origin.related_tasks_iri);
    try {
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: taskQuery,
        queryId: 'Delete Related Tasks from Origin',
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  sparqlQuery = deleteOriginByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Origin"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};

export const editOriginById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id','created','modified'];
  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  const sparqlQuery = selectOriginQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Origin",
    singularizeSchema: singularizeOriginSchema
  });
  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  // determine operation, if missing
  for (let editItem of input) {
    if (editItem.operation !== undefined) continue;

    // if value if empty then treat as a remove
    if (editItem.value.length === 0) {
      editItem.operation = 'remove';
      continue;
    }
    if (Array.isArray(editItem.value) && editItem.value[0] === null) throw new UserInputError(`Field "${editItem.key}" has invalid value "null"`);

    if (!response[0].hasOwnProperty(editItem.key)) {
      editItem.operation = 'add';
    } else {
      editItem.operation = 'replace';

      // Set operation to 'skip' if no change in value
      if (response[0][editItem.key] === editItem.value) editItem.operation ='skip';
    }
  }

  // Push an edit to update the modified time of the object
  const timestamp = new Date().toISOString();
  if (!response[0].hasOwnProperty('created')) {
    let update = {key: "created", value:[`${timestamp}`], operation: "add"}
    input.push(update);
  }
  let operation = "replace";
  if (!response[0].hasOwnProperty('modified')) operation = "add";
  let update = {key: "modified", value:[`${timestamp}`], operation: `${operation}`}
  input.push(update);  

  const query = updateQuery(
    getOriginIri(id),
    'http://csrc.nist.gov/ns/oscal/assessment/common#Origin',
    input,
    originPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Origin"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  if (response !== undefined && 'status' in response) {
    if (response.ok === false || response.status > 299) {
      // Handle reporting Stardog Error
      throw new UserInputError(response.statusText, {
        error_details: response.body.message ? response.body.message : response.body,
        error_code: response.body.code ? response.body.code : 'N/A',
      });
    }
  }

  const selectQuery = selectOriginQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Origin",
    singularizeSchema: singularizeOriginSchema
  });
  const reducer = getReducer("ORIGIN");
  return reducer(result[0]);
};

export const attachToOrigin = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the origin exists
  let select = ['id','iri','object_type'];
  let iri = `<http://cyio.darklight.ai/result--${id}>`;
  sparqlQuery = selectOriginByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Origin",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'origin_actors': 'origin_actors',
    'related_tasks': 'related_tasks',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the origin
  sparqlQuery = attachToOriginQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Origin`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromOrigin = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the origin exists
  let select = ['id','iri','object_type'];
  let iri = `<http://cyio.darklight.ai/result--${id}>`;
  sparqlQuery = selectOriginByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Origin",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'origin_actors': 'origin_actors',
    'related_tasks': 'related_tasks',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeOriginSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the origin
  sparqlQuery = detachFromOriginQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Origin`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};
