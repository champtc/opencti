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
import EntityLeveragedAuthorization from './EntityLeveragedAuthorization';

const subscription = graphql`
  subscription RootLeveragedAuthorizationSubscription($id: ID!) {
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

const leveragedAuthorizationQuery = graphql`
  query RootLeveragedAuthorizationQuery($id: ID!) {
    leveragedAuthorization(id: $id) {
      id
      title
      ...EntityLeveragedAuthorization_leveragedAuthorization
    }
  }
`;

class RootLeveragedAuthorization extends Component {
  constructor(props) {
    super(props);
    const {
      match: {
        params: { leveragedAuthorizationId },
      },
    } = props;
    this.sub = requestSubscription({
      subscription,
      variables: { id: leveragedAuthorizationId },
    });
  }

  componentWillUnmount() {
    this.sub.dispose();
  }

  render() {
    const {
      me,
      match: {
        params: { leveragedAuthorizationId },
      },
    } = this.props;
    const link = `/data/entities/leveraged_authorizations/${leveragedAuthorizationId}/knowledge`;
    return (
      <div>
        <Route path="/data/entities/leveraged_authorizations/:leveragedAuthorizationId/knowledge">
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
          query={leveragedAuthorizationQuery}
          variables={{ id: leveragedAuthorizationId }}
          render={({ error, props, retry }) => {
            if (error) {
              toastGenericError('Failed to get leveraged authorization data');
            }
            if (props) {
              if (props.leveragedAuthorization) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/data/entities/leveraged_authorizations/:leveragedAuthorizationId"
                      render={(routeProps) => (
                        <EntityLeveragedAuthorization
                          {...routeProps}
                          refreshQuery={retry}
                          leveragedAuthorization={props.leveragedAuthorization}
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

RootLeveragedAuthorization.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootLeveragedAuthorization);
