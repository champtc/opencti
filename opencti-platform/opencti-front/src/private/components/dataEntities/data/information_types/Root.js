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
import EntityInformationType from './EntityInformationType';

const subscription = graphql`
  subscription RootInformationTypeSubscription($id: ID!) {
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

const informationTypeQuery = graphql`
  query RootInformationTypeQuery($id: ID!) {
    informationType(id: $id) {
      id
      title
      ...EntityInformationType_informationType
    }
  }
`;

class RootInformationType extends Component {
  constructor(props) {
    super(props);
    const {
      match: {
        params: { informationTypeId },
      },
    } = props;
    this.sub = requestSubscription({
      subscription,
      variables: { id: informationTypeId },
    });
  }

  componentWillUnmount() {
    this.sub.dispose();
  }

  render() {
    const {
      me,
      match: {
        params: { informationTypeId },
      },
    } = this.props;
    const link = `/data/entities/information_types/${informationTypeId}/knowledge`;
    return (
      <div>
        <Route path="/data/entities/information_types/:informationTypeId/knowledge">
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
          query={informationTypeQuery}
          variables={{ id: informationTypeId }}
          render={({ error, props, retry }) => {
            if (error) {
              toastGenericError('Failed to get information type data');
            }
            if (props) {
              if (props.informationType) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/data/entities/information_types/:leveragedAuthorizationId"
                      render={(routeProps) => (
                        <EntityInformationType
                          {...routeProps}
                          refreshQuery={retry}
                          informationType={props.informationType}
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

RootInformationType.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootInformationType);
