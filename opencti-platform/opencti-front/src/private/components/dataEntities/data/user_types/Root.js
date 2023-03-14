/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  Route, withRouter, Switch,
} from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import {
  QueryRenderer,
  requestSubscription,
} from '../../../../../relay/environment';
import Loader from '../../../../../components/Loader';
import ErrorNotFound from '../../../../../components/ErrorNotFound';
import StixCoreObjectKnowledgeBar from '../../../common/stix_core_objects/StixCoreObjectKnowledgeBar';
import { toastGenericError } from '../../../../../utils/bakedToast';
import EntityUserType from './EntityUserType';

const subscription = graphql`
  subscription RootUserTypesSubscription($id: ID!) {
    stixDomainObject(id: $id) {
      # ... on ThreatActor {
        # ...Device_device
        # ...DeviceEditionContainer_device
      # }
      ...FileImportViewer_entity
      ...FileExportViewer_entity
      ...FileExternalReferencesViewer_entity
    }
  }
`;

const locationQuery = graphql`
  query RootUserTypesQuery($id: ID!) {
    oscalLocation(id: $id) {
      id
      name
      ...EntityUserType_userType
    }
  }
`;

class RootUserTypes extends Component {
  constructor(props) {
    super(props);
    const {
      match: {
        params: { userTypeId },
      },
    } = props;
    this.sub = requestSubscription({
      subscription,
      variables: { id: userTypeId },
    });
  }

  componentWillUnmount() {
    this.sub.dispose();
  }

  render() {
    const {
      me,
      match: {
        params: { userTypeId },
      },
    } = this.props;
    const link = `/data/entities/user_types/${userTypeId}/knowledge`;
    return (
      <div>
        <Route path="/data/entities/user_types/:userTypeId/knowledge">
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
        <QueryRenderer
          query={locationQuery}
          variables={{ id: userTypeId }}
          render={({ error, props, retry }) => {
            if (error) {
              console.error(error);
              toastGenericError('Failed to get location data');
            }
            if (props) {
              if (props.oscalLocation) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/data/entities/user_types/:userTypeId"
                      render={(routeProps) => (
                        <EntityUserType
                          {...routeProps}
                          refreshQuery={retry}
                          location={props.oscalLocation}
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
      </div>
    );
  }
}

RootUserTypes.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootUserTypes);
