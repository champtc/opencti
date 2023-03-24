import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import SpriteText from 'three-spritetext';
import { debounce } from 'rxjs/operators';
import { Subject, timer } from 'rxjs';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import inject18n from '../../../../../components/i18n';
import { commitMutation } from '../../../../../relay/environment';
import {
  applyFilters,
  buildGraphData,
  computeTimeRangeInterval,
  computeTimeRangeValues,
  decodeGraphData,
  linkPaint,
  nodeAreaPaint,
  nodeThreePaint,
} from '../../../../../utils/CyioGraph';
import {
  buildViewParamsFromUrlAndStorage,
  saveViewParameters,
} from '../../../../../utils/ListParameters';
import InformationSystemGraphToolBar from './InformationSystemGraphToolBar';
import EntitiesDetailsRightBar from './EntitiesDetailsRightBar';
import {
  containerAddCyioCoreObjectsLinesRelationDeleteMutation,
} from './ContainerAddCyioCoreObjectsLines';

const ignoredCyioCoreObjectsTypes = ['Report', 'Note', 'Opinion'];

const PARAMETERS$ = new Subject().pipe(debounce(() => timer(2000)));
const POSITIONS$ = new Subject().pipe(debounce(() => timer(2000)));

const styles = (theme) => ({
  bottomNav: {
    zIndex: 1000,
    padding: '0 200px 0 205px',
    backgroundColor: theme.palette.navBottom.background,
    display: 'flex',
    height: 50,
    overflow: 'hidden',
  },
  menuItem: {
    justifyContent: 'center',
  },
  dialogContent: {
    height: '400px',
    overflow: 'hidden',
  },
});

export const informationSystemGraphToolQuery = graphql`
  query InformationSystemGraphToolQuery($id: ID!) {
    informationSystem(id: $id) {
      ...InformationSystemGraphTool_graph
    }
  }
`;

class InformationSystemGraphToolComponent extends Component {
  constructor(props) {
    super(props);
    this.initialized = false;
    this.graph = React.createRef();
    this.selectedNodes = new Set();
    this.selectedLinks = new Set();
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      `view-informationSystem-${this.props.informationSystem.id}`,
    );
    this.zoom = R.propOr(null, 'zoom', params);
    this.graphObjects = R.map((n) => n.node, props.informationSystem.objects.edges);
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(props.informationSystem.graph_data),
      props.t,
    );
    const cyioCoreObjectsTypes = R.propOr([], 'cyioCoreObjectsTypes', params);
    const markedBy = R.propOr([], 'markedBy', params);
    const createdBy = R.propOr([], 'createdBy', params);
    const timeRangeInterval = computeTimeRangeInterval(this.graphObjects);
    this.state = {
      mode3D: false,
      popoverAnchorEl: null,
      navOpen: false,
      modeFixed: false,
      modeTree: '',
      displayTimeRange: false,
      selectedTimeRangeInterval: timeRangeInterval,
      cyioCoreObjectsTypes,
      markedBy,
      createdBy,
      graphData: applyFilters(
        this.graphData,
        cyioCoreObjectsTypes,
        markedBy,
        createdBy,
        ignoredCyioCoreObjectsTypes,
      ),
      numberOfSelectedNodes: 0,
      numberOfSelectedLinks: 0,
    };
  }

  initialize() {
    if (this.initialized) return;
    if (this.graph && this.graph.current) {
      this.graph.current.d3Force('link').distance(50);
      if (this.state.modeTree !== '') {
        this.graph.current.d3Force('charge').strength(-1000);
      }
      if (this.zoom && this.zoom.k && !this.state.mode3D) {
        this.graph.current.zoom(this.zoom.k, 400);
      } else {
        const currentContext = this;
        setTimeout(
          () => currentContext.graph
            && currentContext.graph.current
            && currentContext.graph.current.zoomToFit(0, 150),
          1200,
        );
      }
      this.initialized = true;
    }
  }

  componentDidMount() {
    this.saveParameters();
    this.initialize();
  }

  saveParameters(refreshGraphData = false) {
    saveViewParameters(
      this.props.history,
      this.props.location,
      `view-informationSystem-${this.props.informationSystem.id}-knowledge`,
      { zoom: this.zoom, ...this.state },
    );
    if (refreshGraphData) {
      this.setState({
        graphData: applyFilters(
          this.graphData,
          this.state.cyioCoreObjectsTypes,
          this.state.markedBy,
          this.state.createdBy,
          ignoredCyioCoreObjectsTypes,
        ),
      });
    }
  }

  handleToggle3DMode() {
    this.setState({ mode3D: !this.state.mode3D }, () => this.saveParameters());
  }

  handleToggleTreeMode(modeTree) {
    if (modeTree === 'horizontal') {
      this.setState(
        {
          modeTree: this.state.modeTree === 'horizontal' ? '' : 'horizontal',
        },
        () => {
          if (this.state.modeTree === 'horizontal') {
            this.graph.current.d3Force('charge').strength(-1000);
          } else {
            this.graph.current.d3Force('charge').strength(-30);
          }
          this.saveParameters();
        },
      );
    } else if (modeTree === 'vertical') {
      this.setState(
        {
          modeTree: this.state.modeTree === 'vertical' ? '' : 'vertical',
        },
        () => {
          if (this.state.modeTree === 'vertical') {
            this.graph.current.d3Force('charge').strength(-1000);
          } else {
            this.graph.current.d3Force('charge').strength(-30);
          }
          this.saveParameters();
        },
      );
    }
  }

  handleToggleFixedMode() {
    this.setState({ modeFixed: !this.state.modeFixed }, () => {
      this.saveParameters();
      this.handleDragEnd();
      this.forceUpdate();
      this.graph.current.d3ReheatSimulation();
    });
  }

  handleToggleDisplayTimeRange() {
    this.setState({ displayTimeRange: !this.state.displayTimeRange },
      () => this.saveParameters());
  }

  handleToggleCyioCoreObjectType(type) {
    const { cyioCoreObjectsTypes } = this.state;
    if (cyioCoreObjectsTypes.includes(type)) {
      this.setState(
        {
          cyioCoreObjectsTypes: R.filter(
            (t) => t !== type,
            cyioCoreObjectsTypes,
          ),
        },
        () => this.saveParameters(true),
      );
    } else {
      this.setState(
        { cyioCoreObjectsTypes: R.append(type, cyioCoreObjectsTypes) },
        () => this.saveParameters(true),
      );
    }
  }

  handleToggleMarkedBy(markingDefinition) {
    const { markedBy } = this.state;
    if (markedBy.includes(markingDefinition)) {
      this.setState(
        {
          markedBy: R.filter((t) => t !== markingDefinition, markedBy),
        },
        () => this.saveParameters(true),
      );
    } else {
      // eslint-disable-next-line max-len
      this.setState({ markedBy: R.append(markingDefinition, markedBy) },
        () => this.saveParameters(true));
    }
  }

  handleToggleCreateBy(createdByRef) {
    const { createdBy } = this.state;
    if (createdBy.includes(createdByRef)) {
      this.setState(
        {
          createdBy: R.filter((t) => t !== createdByRef, createdBy),
        },
        () => this.saveParameters(true),
      );
    } else {
      // eslint-disable-next-line max-len
      this.setState({ createdBy: R.append(createdByRef, createdBy) },
        () => this.saveParameters(true));
    }
  }

  handleZoomToFit() {
    this.graph.current.zoomToFit(400, 150);
  }

  handleZoomEnd(zoom) {
    if (
      this.initialized
      && (zoom.k !== this.zoom?.k
        || zoom.x !== this.zoom?.x
        || zoom.y !== this.zoom?.y)
    ) {
      this.zoom = zoom;
      PARAMETERS$.next({ action: 'SaveParameters' });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleDragEnd() {
    POSITIONS$.next({ action: 'SavePositions' });
  }

  handleChangeNav() {
    this.setState({ navOpen: !this.state.navOpen });
  }

  handleNodeClick(node, event) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      if (this.selectedNodes.has(node)) {
        this.selectedNodes.delete(node);
      } else {
        this.selectedNodes.add(node);
      }
    } else {
      const untoggle = this.selectedNodes.has(node) && this.selectedNodes.size === 1;
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      if (!untoggle) this.selectedNodes.add(node);
    }
    this.handleChangeNav();
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleLinkClick(link, event) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      if (this.selectedLinks.has(link)) {
        this.selectedLinks.delete(link);
      } else {
        this.selectedLinks.add(link);
      }
    } else {
      const untoggle = this.selectedLinks.has(link) && this.selectedLinks.size === 1;
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      if (!untoggle) {
        this.selectedLinks.add(link);
      }
    }
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleBackgroundClick() {
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleAddEntity(cyioCoreObject) {
    if (R.map((n) => n.id, this.graphObjects).includes(cyioCoreObject.id)) return;
    this.graphObjects = [...this.graphObjects, cyioCoreObject];
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(this.props.informationSystem.graph_data),
      this.props.t,
    );
    const selectedTimeRangeInterval = computeTimeRangeInterval(
      this.graphObjects,
    );
    this.setState(
      {
        selectedTimeRangeInterval,
        graphData: applyFilters(
          this.graphData,
          this.state.cyioCoreObjectsTypes,
          this.state.markedBy,
          this.state.createdBy,
          ignoredCyioCoreObjectsTypes,
          selectedTimeRangeInterval,
        ),
      },
      () => {
        setTimeout(() => this.handleZoomToFit(), 1500);
      },
    );
  }

  handleDelete(cyioCoreObject) {
    this.graphObjects = R.filter(
      (n) => n.id !== cyioCoreObject.id
        && n.from?.id !== cyioCoreObject.id
        && n.to?.id !== cyioCoreObject.id,
      this.graphObjects,
    );
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(this.props.informationSystem.graph_data),
      this.props.t,
    );
    this.setState({
      graphData: applyFilters(
        this.graphData,
        this.state.cyioCoreObjectsTypes,
        this.state.markedBy,
        this.state.createdBy,
        ignoredCyioCoreObjectsTypes,
        this.state.selectedTimeRangeInterval,
      ),
    });
  }

  handleDeleteSelected() {
    // Remove selected nodes
    const selectedNodes = Array.from(this.selectedNodes);
    commitMutation({
      mutation: containerAddCyioCoreObjectsLinesRelationDeleteMutation,
      variables: {
        id: this.props.informationSystem.id,
        entityId: selectedNodes[0].id,
        implementationType: selectedNodes[0].entity_type,
      },
    });
    this.selectedNodes.clear();
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(this.props.informationSystem.graph_data),
      this.props.t,
    );
    this.setState({
      graphData: applyFilters(
        this.graphData,
        this.state.cyioCoreObjectsTypes,
        this.state.markedBy,
        this.state.createdBy,
        ignoredCyioCoreObjectsTypes,
        this.state.selectedTimeRangeInterval,
      ),
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleSelectAll() {
    this.selectedLinks.clear();
    this.selectedNodes.clear();
    R.map((n) => this.selectedNodes.add(n), this.state.graphData.nodes);
    this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
  }

  handleSelectByType(type) {
    this.selectedLinks.clear();
    this.selectedNodes.clear();
    R.map(
      (n) => n.entity_type === type && this.selectedNodes.add(n),
      this.state.graphData.nodes,
    );
    this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
  }

  handleResetLayout() {
    this.graphData = buildGraphData(this.graphObjects, {}, this.props.t);
    this.setState(
      {
        graphData: applyFilters(
          this.graphData,
          this.state.cyioCoreObjectsTypes,
          this.state.markedBy,
          this.state.createdBy,
          ignoredCyioCoreObjectsTypes,
          this.state.selectedTimeRangeInterval,
        ),
      },
      () => {
        this.handleDragEnd();
        this.forceUpdate();
        this.graph.current.d3ReheatSimulation();
        POSITIONS$.next({ action: 'SavePositions' });
      },
    );
  }

  handleTimeRangeChange(selectedTimeRangeInterval) {
    this.setState({
      selectedTimeRangeInterval,
      graphData: applyFilters(
        this.graphData,
        this.state.cyioCoreObjectsTypes,
        this.state.markedBy,
        this.state.createdBy,
        [],
        selectedTimeRangeInterval,
      ),
    });
  }

  render() {
    const {
      informationSystem, theme, t, classes,
    } = this.props;
    const {
      mode3D,
      modeFixed,
      modeTree,
      cyioCoreObjectsTypes: currentCyioCoreObjectsTypes,
      markedBy: currentMarkedBy,
      createdBy: currentCreatedBy,
      graphData,
      numberOfSelectedNodes,
      numberOfSelectedLinks,
      displayTimeRange,
      selectedTimeRangeInterval,
      navOpen,
    } = this.state;
    const width = window.innerWidth - (navOpen ? 210 : 60);
    const height = window.innerHeight - 60;
    const cyioCoreObjectsTypes = R.uniq(
      R.map((n) => n.entity_type, this.graphData.nodes),
    );
    const markedBy = R.uniqBy(
      R.prop('id'),
      R.flatten(R.map((n) => n.markedBy, this.graphData.nodes)),
    );
    const createdBy = R.uniqBy(
      R.prop('id'),
      R.map((n) => n.createdBy, this.graphData.nodes),
    );
    const selectedEntities = [...this.selectedLinks, ...this.selectedNodes];
    const timeRangeInterval = computeTimeRangeInterval(this.graphObjects);
    const timeRangeValues = computeTimeRangeValues(
      timeRangeInterval,
      this.graphObjects,
    );
    const displayLabels = graphData.links.length < 200;
    return (
      <div>
        <InformationSystemGraphToolBar
          handleToggle3DMode={this.handleToggle3DMode.bind(this)}
          currentMode3D={mode3D}
          currentModeFixed={modeFixed}
          handleToggleTreeMode={this.handleToggleTreeMode.bind(this)}
          currentModeTree={modeTree}
          handleToggleFixedMode={this.handleToggleFixedMode.bind(this)}
          handleZoomToFit={this.handleZoomToFit.bind(this)}
          handleToggleCreatedBy={this.handleToggleCreateBy.bind(this)}
          handleToggleCyioCoreObjectType={this.handleToggleCyioCoreObjectType.bind(
            this,
          )}
          handleToggleMarkedBy={this.handleToggleMarkedBy.bind(this)}
          cyioCoreObjectsTypes={cyioCoreObjectsTypes}
          currentCyioCoreObjectsTypes={currentCyioCoreObjectsTypes}
          markedBy={markedBy}
          currentMarkedBy={currentMarkedBy}
          createdBy={createdBy}
          currentCreatedBy={currentCreatedBy}
          handleSelectAll={this.handleSelectAll.bind(this)}
          handleSelectByType={this.handleSelectByType.bind(this)}
          informationSystem={informationSystem}
          onAdd={this.handleAddEntity.bind(this)}
          onDelete={this.handleDelete.bind(this)}
          handleDeleteSelected={this.handleDeleteSelected.bind(this)}
          selectedNodes={Array.from(this.selectedNodes)}
          selectedLinks={Array.from(this.selectedLinks)}
          numberOfSelectedNodes={numberOfSelectedNodes}
          numberOfSelectedLinks={numberOfSelectedLinks}
          handleResetLayout={this.handleResetLayout.bind(this)}
          displayTimeRange={displayTimeRange}
          handleToggleDisplayTimeRange={this.handleToggleDisplayTimeRange.bind(
            this,
          )}
          timeRangeInterval={timeRangeInterval}
          selectedTimeRangeInterval={selectedTimeRangeInterval}
          handleTimeRangeChange={this.handleTimeRangeChange.bind(this)}
          timeRangeValues={timeRangeValues}
        />
        {selectedEntities.length > 0 && (
          <EntitiesDetailsRightBar
            selectedEntity={selectedEntities[0]}
            handleChangeNav={this.handleChangeNav.bind(this)}
            navOpen={navOpen}
          />
        )}
        {mode3D ? (
          <ForceGraph3D
            ref={this.graph}
            width={width}
            height={height}
            backgroundColor={theme.palette.background.default}
            graphData={graphData}
            nodeThreeObjectExtend={true}
            nodeThreeObject={(node) => nodeThreePaint(node, theme.palette.text.secondary)
            }
            linkColor={(link) => (this.selectedLinks.has(link)
              ? theme.palette.secondary.main
              : theme.palette.primary.main)
            }
            linkWidth={0.2}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={0.99}
            linkThreeObjectExtend={true}
            linkThreeObject={(link) => {
              if (!displayLabels) return null;
              const sprite = new SpriteText(link.label);
              sprite.color = 'lightgrey';
              sprite.textHeight = 1.5;
              return sprite;
            }}
            linkPositionUpdate={(sprite, { start, end }) => {
              const middlePos = Object.assign(
                ...['x', 'y', 'z'].map((c) => ({
                  [c]: start[c] + (end[c] - start[c]) / 2,
                })),
              );
              Object.assign(sprite.position, middlePos);
            }}
            onNodeClick={this.handleNodeClick.bind(this)}
            onNodeRightClick={(node) => {
              // eslint-disable-next-line no-param-reassign
              node.fx = undefined;
              // eslint-disable-next-line no-param-reassign
              node.fy = undefined;
              // eslint-disable-next-line no-param-reassign
              node.fz = undefined;
              this.handleDragEnd();
              this.forceUpdate();
            }}
            onNodeDrag={(node, translate) => {
              if (this.selectedNodes.has(node)) {
                [...this.selectedNodes]
                  .filter((selNode) => selNode !== node)
                  // eslint-disable-next-line no-shadow
                  .forEach((node) => ['x', 'y', 'z'].forEach(
                    // eslint-disable-next-line no-param-reassign,no-return-assign
                    (coord) => (node[`f${coord}`] = node[coord] + translate[coord]),
                  ));
              }
            }}
            onNodeDragEnd={(node) => {
              if (this.selectedNodes.has(node)) {
                // finished moving a selected node
                [...this.selectedNodes]
                  .filter((selNode) => selNode !== node) // don't touch node being dragged
                  // eslint-disable-next-line no-shadow
                  .forEach((node) => {
                    ['x', 'y'].forEach(
                      // eslint-disable-next-line no-param-reassign,no-return-assign
                      (coord) => (node[`f${coord}`] = undefined),
                    );
                    // eslint-disable-next-line no-param-reassign
                    node.fx = node.x;
                    // eslint-disable-next-line no-param-reassign
                    node.fy = node.y;
                    // eslint-disable-next-line no-param-reassign
                    node.fz = node.z;
                  });
              }
              // eslint-disable-next-line no-param-reassign
              node.fx = node.x;
              // eslint-disable-next-line no-param-reassign
              node.fy = node.y;
              // eslint-disable-next-line no-param-reassign
              node.fz = node.z;
            }}
            onLinkClick={this.handleLinkClick.bind(this)}
            onBackgroundClick={this.handleBackgroundClick.bind(this)}
            cooldownTicks={modeFixed ? 0 : 'Infinity'}
            dagMode={
              // eslint-disable-next-line no-nested-ternary
              modeTree === 'horizontal'
                ? 'lr'
                : modeTree === 'vertical'
                  ? 'td'
                  : undefined
            }
          />
        ) : (
          <ForceGraph2D
            ref={this.graph}
            width={width}
            height={height}
            graphData={graphData}
            onZoomEnd={this.handleZoomEnd.bind(this)}
            backgroundColor={theme.palette.background.default}
            nodeRelSize={4}
            // nodeCanvasObject={
            //   (node, ctx) => nodePaint(node, node.color, ctx, this.selectedNodes.has(node))
            // }
            nodePointerAreaPaint={nodeAreaPaint}
            // linkDirectionalParticles={(link) => (this.selectedLinks.has(link) ? 20 : 0)}
            // linkDirectionalParticleWidth={1}
            // linkDirectionalParticleSpeed={() => 0.004}
            linkCanvasObjectMode={() => 'after'}
            linkCanvasObject={(link, ctx) => (displayLabels
              ? linkPaint(link, ctx, theme.palette.text.secondary)
              : null)
            }
            linkColor={(link) => (this.selectedLinks.has(link)
              ? theme.palette.secondary.main
              : theme.palette.primary.main)
            }
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={0.99}
            onNodeClick={this.handleNodeClick.bind(this)}
            onNodeRightClick={(node) => {
              // eslint-disable-next-line no-param-reassign
              node.fx = undefined;
              // eslint-disable-next-line no-param-reassign
              node.fy = undefined;
              this.handleDragEnd();
              this.forceUpdate();
            }}
            onNodeDrag={(node, translate) => {
              if (this.selectedNodes.has(node)) {
                [...this.selectedNodes]
                  .filter((selNode) => selNode !== node)
                  // eslint-disable-next-line no-shadow
                  .forEach((node) => ['x', 'y'].forEach(
                    // eslint-disable-next-line no-param-reassign,no-return-assign
                    (coord) => (node[`f${coord}`] = node[coord] + translate[coord]),
                  ));
              }
            }}
            onNodeDragEnd={(node) => {
              if (this.selectedNodes.has(node)) {
                // finished moving a selected node
                [...this.selectedNodes]
                  .filter((selNode) => selNode !== node) // don't touch node being dragged
                  // eslint-disable-next-line no-shadow
                  .forEach((node) => {
                    ['x', 'y'].forEach(
                      // eslint-disable-next-line no-param-reassign,no-return-assign
                      (coord) => (node[`f${coord}`] = undefined),
                    );
                    // eslint-disable-next-line no-param-reassign
                    node.fx = node.x;
                    // eslint-disable-next-line no-param-reassign
                    node.fy = node.y;
                  });
              }
              // eslint-disable-next-line no-param-reassign
              node.fx = node.x;
              // eslint-disable-next-line no-param-reassign
              node.fy = node.y;
              this.handleDragEnd();
            }}
            onLinkClick={this.handleLinkClick.bind(this)}
            onBackgroundClick={this.handleBackgroundClick.bind(this)}
            cooldownTicks={modeFixed ? 0 : 'Infinity'}
            dagMode={
              // eslint-disable-next-line no-nested-ternary
              modeTree === 'horizontal'
                ? 'lr'
                : modeTree === 'vertical'
                  ? 'td'
                  : undefined
            }
            dagLevelDistance={50}
          />
        )}
      </div>
    );
  }
}

InformationSystemGraphToolComponent.propTypes = {
  informationSystem: PropTypes.object,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

const InformationSystemGraphTool = createFragmentContainer(
  InformationSystemGraphToolComponent,
  {
    informationSystem: graphql`
      fragment InformationSystemGraphTool_graph on InformationSystem {
        id
        system_ids
        system_name
        graph_data
        objects(all: true) {
          edges {
            node {
              ... on BasicObject {
                __typename
                id
                entity_type
              }
              ... on LifecycleObject {
                __typename
                created
                modified
              }
              ... on InformationSystem {
                __typename
                id
                entity_type
                system_name
              }
              ... on InformationType {
                __typename
                id
                entity_type
                title
                created
                modified
              }
              ... on InventoryItem {
                __typename
                id
                entity_type
                name
                asset_type
              }
              ... on Component {
                __typename
                id
                entity_type
                name
                component_type
              }
              ... on OscalUser {
                __typename
                id
                entity_type
                user_type
                name
              }
              ... on OscalLeveragedAuthorization {
                __typename
                id
                entity_type
                title
                date_authorized
              }
              ... on OscalRelationship {
                __typename
                id
                entity_type
                relationship_type
                source
                target
              }
              ... on CyioLabel {
                __typename
                id
                entity_type
                name
                color
              }
              ... on CyioExternalReference {
                __typename
                id
                entity_type
                url
                source_name
                external_id
              }
              ... on CyioNote {
                __typename
                id
                entity_type
                abstract
                content
              }
            }
          }
        }
      }
    `,
  },
);

export default R.compose(
  inject18n,
  withRouter,
  withTheme,
  withStyles(styles),
)(InformationSystemGraphTool);
