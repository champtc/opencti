import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, withRouter, Switch } from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import {
  QueryRenderer,
  requestSubscription,
} from '../../../../../relay/environment';
import Loader from '../../../../../components/Loader';
import ErrorNotFound from '../../../../../components/ErrorNotFound';
import StixCoreObjectKnowledgeBar from '../../../common/stix_core_objects/StixCoreObjectKnowledgeBar';
import { toastGenericError } from '../../../../../utils/bakedToast';
import EntityDataMarking from './EntityDataMarking';

const subscription = graphql`
  subscription RootDataMarkingSubscription($id: ID!) {
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

const dataMarkingQuery = graphql`
  query RootDataMarkingQuery($id: ID!) {
    dataMarking(id: $id) {
      ...EntityDataMarking_dataMarking
    }
  }
`;

class RootDataMarking extends Component {
  constructor(props) {
    super(props);
    const {
      match: {
        params: { dataMarkingId },
      },
    } = props;
    this.sub = requestSubscription({
      subscription,
      variables: { id: dataMarkingId },
    });
  }

  componentWillUnmount() {
    this.sub.dispose();
  }

  render() {
    const {
      match: {
        params: { dataMarkingId },
      },
    } = this.props;
    const link = `/data/entities/data_markings/${dataMarkingId}/knowledge`;
    return (
      <div>
        <Route path='/data/entities/data_markings/:dataMarkingId/knowledge'>
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
          query={dataMarkingQuery}
          variables={{ id: dataMarkingId }}
          render={({ error, props, retry }) => {
            if (error) {
              toastGenericError('Failed to get data marking data');
            }
            if (props) {
              if (props.dataMarking) {
                return (
                  <Switch>
                    <Route
                      exact
                      path='/data/entities/data_markings/:dataMarkingId'
                      render={(routeProps) => (
                        <EntityDataMarking
                          {...routeProps}
                          refreshQuery={retry}
                          dataMarking={props.dataMarking}
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

RootDataMarking.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootDataMarking);
