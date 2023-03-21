/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, withRouter, Switch } from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import {
  QueryRenderer,
  requestSubscription,
} from '../../../../relay/environment';
import InformationSystem from './InformationSystem';
import Analysis from './analysis/Analysis';
import Loader from '../../../../components/Loader';
import ErrorNotFound from '../../../../components/ErrorNotFound';
import StixCoreObjectKnowledgeBar from '../../common/stix_core_objects/StixCoreObjectKnowledgeBar';
import TopBar from '../../nav/TopBar';

const informationSystemQuery = graphql`
  query RootInformationSystemQuery($id: ID!) {
    informationSystem(id: $id) {
      id
      short_name
      ...InformationSystem_information
      ...Analysis_analysis
    }
  }
`;

class RootInformationSystem extends Component {
  render() {
    const {
      me,
      match: {
        params: { informationSystemId },
      },
    } = this.props;
    const link = `/defender_hq/assets/information_systems/${informationSystemId}/knowledge`;
    return (
      <div>
        <Route path="/defender_hq/assets/information_systems/:informationSystemId/knowledge">
          <StixCoreObjectKnowledgeBar
            stixCoreObjectLink={link}
            availableSections={[
              'attribution',
              'victimology',
              'incidents',
              'malwares',
              'tools',
              'attack_patterns',
              'vulnerabilities',
              'observables',
              'infrastructures',
              'sightings',
            ]}
          />
        </Route>
        <TopBar me={me || null} />
        <QueryRenderer
          query={informationSystemQuery}
          variables={{ id: informationSystemId }}
          render={({ props, retry }) => {
            if (props) {
              if (props.informationSystem) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/defender_hq/assets/information_systems/:informationSystemId"
                      render={(routeProps) => (
                        <InformationSystem
                          {...routeProps}
                          refreshQuery={retry}
                          informationSystem={props.informationSystem}
                        />
                      )}
                    />
                    <Route
                      exact
                      path="/defender_hq/assets/information_systems/:informationSystemId/analysis"
                      render={(routeProps) => (
                        <Analysis
                          {...routeProps}
                          refreshQuery={retry}
                          informationSystem={props.informationSystem}
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

RootInformationSystem.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootInformationSystem);
