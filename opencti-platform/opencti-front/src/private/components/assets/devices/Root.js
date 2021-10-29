import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  Route, Redirect, withRouter, Switch,
} from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer as QR } from 'react-relay';
import QueryRendererDarkLight from '../../../../relay/environmentDarkLight';
import {
  QueryRenderer,
  requestSubscription,
} from '../../../../relay/environment';
import TopBar from '../../nav/TopBar';
import Device from './Device';
import DeviceKnowledge from './DeviceKnowledge';
import Loader from '../../../../components/Loader';
import FileManager from '../../common/files/FileManager';
import StixDomainObjectHeader from '../../common/stix_domain_objects/StixDomainObjectHeader';
import DevicePopover from './DevicePopover';
import StixCoreObjectHistory from '../../common/stix_core_objects/StixCoreObjectHistory';
import StixCoreObjectOrStixCoreRelationshipContainers from '../../common/containers/StixCoreObjectOrStixCoreRelationshipContainers';
import StixDomainObjectIndicators from '../../observations/indicators/StixDomainObjectIndicators';
import StixCoreRelationship from '../../common/stix_core_relationships/StixCoreRelationship';
import ErrorNotFound from '../../../../components/ErrorNotFound';
import StixCoreObjectKnowledgeBar from '../../common/stix_core_objects/StixCoreObjectKnowledgeBar';

const subscription = graphql`
  subscription RootDeviceSubscription($id: ID!) {
    stixDomainObject(id: $id) {
      ... on ThreatActor {
        ...Device_device
        ...DeviceEditionContainer_device
      }
      ...FileImportViewer_entity
      ...FileExportViewer_entity
      ...FileExternalReferencesViewer_entity
    }
  }
`;

const deviceQuery = graphql`
  query RootDeviceQuery($id: String!) {
    threatActor(id: $id) {
      id
      standard_id
      name
      aliases
      x_opencti_graph_data
      ...Device_device
      ...DeviceKnowledge_device
      ...FileImportViewer_entity
      ...FileExportViewer_entity
      ...FileExternalReferencesViewer_entity
    }
    connectorsForExport {
      ...FileManager_connectorsExport
    }
  }
`;

const deviceDarkLightQuery = graphql`
  query RootDeviceDarkLightQuery($computingDeviceAssetId: ID!) {
    computingDeviceAsset(id: $computingDeviceAssetId) {
      id
      name
      asset_id
      labels
      description
      locations {
        city
        country
        description
      }
      version
      vendor_name
      asset_tag
      asset_type
      serial_number
      release_date
      operational_status
      ...DeviceDetails_device  
    }
  }
`;

class RootDevice extends Component {
  constructor(props) {
    super(props);
    const {
      match: {
        params: { deviceId },
      },
    } = props;
    this.sub = requestSubscription({
      subscription,
      variables: { id: deviceId },
    });
  }

  componentWillUnmount() {
    this.sub.dispose();
  }

  render() {
    const {
      me,
      match: {
        params: { deviceId },
      },
    } = this.props;
    const link = `/dashboard/assets/devices/${deviceId}/knowledge`;
    return (
      <div>
        <TopBar me={me || null} />
        <Route path="/dashboard/assets/devices/:deviceId/knowledge">
          <StixCoreObjectKnowledgeBar
            stixCoreObjectLink={link}
            availableSections={[
              'victimology',
              'devices',
              'network',
              'software',
              'incidents',
              'malwares',
              'attack_patterns',
              'tools',
              'vulnerabilities',
              'observables',
              'infrastructures',
              'sightings',
            ]}
          />
        </Route>
        <QR
          environment={QueryRendererDarkLight}
          query={deviceDarkLightQuery}
          variables={{ computingDeviceAssetId: deviceId }}
          render={({ error, props }) => {
            console.log(`deviceDarkLightQuery ${JSON.stringify(props)} OR Error: ${error}`);
            if (props) {
              if (props.computingDeviceAsset) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId"
                      render={(routeProps) => (
                        <Device
                          {...routeProps}
                          device={props.computingDeviceAsset}
                        />
                      )}
                    />
                </Switch>
                );
              }
              return <ErrorNotFound />;
            }
            return <Loader />;
          }}
        />
        {/* <QueryRenderer
          query={deviceQuery}
          variables={{ id: deviceId }}
          render={({ props }) => {
            if (props) {
              if (props.threatActor) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId"
                      render={(routeProps) => (
                        <Device
                          {...routeProps}
                          device={props.threatActor}
                        />
                      )}
                    />
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId/knowledge"
                      render={() => (
                        <Redirect
                          to={`/dashboard/assets/devices/${deviceId}/knowledge/overview`}
                        />
                      )}
                    />
                    <Route
                      path="/dashboard/assets/devices/:deviceId/knowledge"
                      render={(routeProps) => (
                        <DeviceKnowledge
                          {...routeProps}
                          device={props.threatActor}
                        />
                      )}
                    />
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId/analysis"
                      render={(routeProps) => (
                        <React.Fragment>
                          <StixDomainObjectHeader
                            stixDomainObject={props.threatActor}
                            PopoverComponent={<DevicePopover />}
                          />
                          <StixCoreObjectOrStixCoreRelationshipContainers
                            {...routeProps}
                            stixDomainObjectOrStixCoreRelationship={
                              props.threatActor
                            }
                          />
                        </React.Fragment>
                      )}
                    />
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId/indicators"
                      render={(routeProps) => (
                        <React.Fragment>
                          <StixDomainObjectHeader
                            stixDomainObject={props.threatActor}
                            PopoverComponent={<DevicePopover />}
                            variant="noaliases"
                          />
                          <StixDomainObjectIndicators
                            {...routeProps}
                            stixDomainObjectId={deviceId}
    stixDomainObjectLink={`/dashboard/assets/devices/${deviceId}/indicators`}
                          />
                        </React.Fragment>
                      )}
                    />
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId/indicators/relations/:relationId"
                      render={(routeProps) => (
                        <StixCoreRelationship
                          entityId={deviceId}
                          {...routeProps}
                        />
                      )}
                    />
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId/files"
                      render={(routeProps) => (
                        <React.Fragment>
                          <StixDomainObjectHeader
                            stixDomainObject={props.threatActor}
                            PopoverComponent={<DevicePopover />}
                          />
                          <FileManager
                            {...routeProps}
                            id={deviceId}
                            connectorsImport={[]}
                            connectorsExport={props.connectorsForExport}
                            entity={props.threatActor}
                          />
                        </React.Fragment>
                      )}
                    />
                    <Route
                      exact
                      path="/dashboard/assets/devices/:deviceId/history"
                      render={(routeProps) => (
                        <React.Fragment>
                          <StixDomainObjectHeader
                            stixDomainObject={props.threatActor}
                            PopoverComponent={<DevicePopover />}
                          />
                          <StixCoreObjectHistory
                            {...routeProps}
                            stixCoreObjectId={deviceId}
                          />
                        </React.Fragment>
                      )}
                    />
                  </Switch>
                );
              }
              return <ErrorNotFound />;
            }
            return <Loader />;
          }}
        /> */}
      </div>
    );
  }
}

RootDevice.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootDevice);
