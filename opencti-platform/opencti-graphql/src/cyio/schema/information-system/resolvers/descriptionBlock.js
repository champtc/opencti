import {
	findAllDescriptionBlocks,
	findDescriptionBlockById,
	createDescriptionBlock,
	deleteDescriptionBlockById,
	editDescriptionBlockById,
	attachToDescriptionBlock,
	detachFromDescriptionBlock,
	findAllDiagramRefs,
	findDiagramRefById,
  findDiagramRefByIri,
	createDiagramRef,
	deleteDiagramRefById,
	editDiagramRefById,
} from '../domain/descriptionBlock.js';
import { findDataMarkingByIri } from '../../data-markings/domain/dataMarkings.js';
import { findLabelByIri } from '../../global/domain/label.js';
import { findLinkByIri } from '../../risk-assessments/oscal-common/domain/oscalLink.js';
import { findRemarkByIri } from '../../risk-assessments/oscal-common/domain/oscalRemark.js';


const cyioDescriptionBlockResolvers = {
	Query: {
		// Description Block
		descriptionBlocks: async (_, args, { dbName, dataSources, selectMap }) => findAllDescriptionBlocks(args, dbName, dataSources, selectMap.getNode('node')),
		descriptionBlock: async (_, { id }, { dbName, dataSources, selectMap }) => findDescriptionBlockById(id, dbName, dataSources, selectMap.getNode('descriptionBlock')),

		// Diagram
		diagramRefs: async (_, args, { dbName, dataSources, selectMap }) => findAllDiagramRefs(args, dbName, dataSources, selectMap.getNode('node')),
		diagramRef: async (_, { id }, { dbName, dataSources, selectMap }) => findDiagramRefById(id, dbName, dataSources, selectMap.getNode('diagramRef')),
	},
	Mutation: {
		// Description Block
		createDescriptionBlock: async (_, { input }, { dbName, selectMap, dataSources }) => createDescriptionBlock(input, dbName, dataSources, selectMap.getNode("createDescriptionBlock")),
		deleteDescriptionBlock: async (_, { id }, { dbName, dataSources }) => deleteDescriptionBlockById( id, dbName, dataSources),
		deleteDescriptionBlocks: async (_, { ids }, { dbName, dataSources }) => deleteDescriptionBlockById( ids, dbName, dataSources),
		editDescriptionBlock: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editDescriptionBlockById(id, input, dbName, dataSources, selectMap.getNode("editDescriptionBlock"), schema),
		attachToDescriptionBlock: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToDescriptionBlock(id, field, entityId ,dbName, dataSources),
		detachFromDescriptionBlock: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromDescriptionBlock(id, field, entityId ,dbName, dataSources),

		// Diagram
		createDiagramRef: async (_, { input }, { dbName, selectMap, dataSources }) => createDiagramRef(input, dbName, selectMap.getNode("createDiagramRef"), dataSources),
		deleteDiagramRef: async (_, { id }, { dbName, dataSources }) => deleteDiagramRefById( id, dbName, dataSources),
		deleteDiagramRefs: async (_, { ids }, { dbName, dataSources }) => deleteDiagramRefById( ids, dbName, dataSources),
		editDiagramRef: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editDiagramRefById(id, input, dbName, dataSources, selectMap.getNode("editDiagramRef"), schema),
	},
	DescriptionBlock: {
		diagrams: async (parent, _, { dbName, dataSources, selectMap }) => {
			if (parent.diagram_iris === undefined) return [];
			let results = []
			for (let iri of parent.diagram_iris) {
				// WORK AROUND
				if (!iri.includes('diagram')) continue;
				// END WORK AROUND
				let result = await findDiagramRefByIri(iri, dbName, dataSources, selectMap.getNode('diagrams'));
				if (result === undefined || result === null) return null;
				results.push(result);
			}
			return results;
		},
    object_markings: async (parent, _, { dbName, dataSources, selectMap}) => {
      if (parent.marking_iris === undefined) return [];
      let results = []
      for (let iri of parent.marking_iris) {
        let result = await findDataMarkingByIri(iri, dbName, dataSources, selectMap.getNode('object_markings'));
        if (result === undefined || result === null) return null;
        results.push(result);
      }
      return results;
    },
    labels: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.label_iris === undefined) return [];
      let results = []
      for (let iri of parent.label_iris) {
        let result = await findLabelByIri(iri, dbName, dataSources, selectMap.getNode('labels'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    links: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.link_iris) {
        let result = await findLinkByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    remarks: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.remark_iris === undefined) return [];
      let results = []
      for (let iri of parent.remark_iris) {
        let result = await findRemarkByIri(iri, dbName, dataSources, selectMap.getNode('remarks'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
	},
};

export default cyioDescriptionBlockResolvers;
  