import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, withRouter, Switch } from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import {
  QueryRenderer,
} from '../../../../relay/environment';
import Loader from '../../../../components/Loader';
import ErrorNotFound from '../../../../components/ErrorNotFound';
import StixCoreObjectKnowledgeBar from '../../common/stix_core_objects/StixCoreObjectKnowledgeBar';
import TopBar from '../../nav/TopBar';

// const subscription = graphql`
//   subscription RootRiskSubscription($id: ID!) {
//     stixDomainObject(id: $id) {
//       # ... on ThreatActor {
//       #   ...Risk_risk
//       #   ...RiskEditionContainer_risk
//       # }
//       ...FileImportViewer_entity
//       ...FileExportViewer_entity
//       ...FileExternalReferencesViewer_entity
//     }
//   }
// `;

const assessmentQuery = graphql`
  query RootAssessmentQuery($id: ID!) {
    risk(id: $id) {
      id
      name
      #...Risk_risk
      #...RiskAnalysisContainer_risk
      # ...Remediations_risk
    }
  }
`;

class RootAssessment extends Component {
  render() {
    const {
      me,
      match: {
        params: { assessmentId },
      },
    } = this.props;
    const link = `/activities/assessments/assessment_results/${assessmentId}/knowledge`;
    return (
      <div>
        <Route path="/activities/assessments/assessment_results/:assessmentId/knowledge">
          <StixCoreObjectKnowledgeBar
            stixCoreObjectLink={link}
            availableSections={[
              'victimology',
              'risks',
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
        <TopBar me={me || null} />
        <QueryRenderer
          query={assessmentQuery}
          variables={{ id: assessmentId }}
          render={({ props, retry }) => {
            if (props) {
              if (props.risk) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/activities/assessments/assessment_results/:assessmentId"
                      // render={(routeProps) => (
                      //   <Risk
                      //     {...routeProps}
                      //     refreshQuery={retry}
                      //     risk={props.risk}
                      //   />
                      // )}
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

RootAssessment.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootAssessment);
