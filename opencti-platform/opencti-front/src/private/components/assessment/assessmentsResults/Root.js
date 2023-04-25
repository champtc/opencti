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
import Assessment from './Assessment';
import AssessmentKnowledge from './AssessmentKnowledge';
import AssessmentAnalysis from './AssessmentAnalysis';
import AssessmentActivity from './AssessmentActivity';

const assessmentQuery = graphql`
  query RootAssessmentQuery($id: ID!) {
    risk(id: $id) {
      id
      name
      ...Assessment_data
      ...AssessmentActivity_data
      ...AssessmentAnalysis_data
      ...AssessmentKnowledge_data
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
    return (
      <div>
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
                      path='/activities/assessments/assessment_results/:assessmentId'
                      render={(routeProps) => (
                        <Assessment
                          {...routeProps}
                          refreshQuery={retry}
                          assessment={props.risk}
                        />
                      )}
                    />
                    <Route
                      exact
                      path='/activities/assessments/assessment_results/:assessmentId/knowledge'
                      render={(routeProps) => (
                        <AssessmentKnowledge
                          {...routeProps}
                          refreshQuery={retry}
                          assessment={props.risk}
                        />
                      )}
                    />
                    <Route
                      exact
                      path='/activities/assessments/assessment_results/:assessmentId/analysis'
                      render={(routeProps) => (
                        <AssessmentAnalysis
                          {...routeProps}
                          refreshQuery={retry}
                          assessment={props.risk}
                        />
                      )}
                    />
                    <Route
                      exact
                      path='/activities/assessments/assessment_results/:assessmentId/activities'
                      render={(routeProps) => (
                        <AssessmentActivity
                          {...routeProps}
                          refreshQuery={retry}
                          assessment={props.risk}
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

RootAssessment.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootAssessment);
