import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Switch, Redirect } from 'react-router-dom';
import { BoundaryRoute } from '../Error';
import RootAssessment from './assessmentsResults/Root';
import Assessments from './Assessments';

class Root extends Component {
  render() {
    const { me } = this.props;
    return (
      <Switch>
        <BoundaryRoute
          exact
          path='/activities/assessments'
          render={() => <Redirect to='/activities/assessments/assessment_results' />}
        />
        <BoundaryRoute
          exact
          path='/activities/assessments/assessment_results'
          component={Assessments}
        />
        <BoundaryRoute
          path='/activities/assessments/assessment_results/:assessmentId'
          render={(routeProps) => <RootAssessment {...routeProps} me={me} />}
        />
      </Switch>
    );
  }
}

Root.propTypes = {
  me: PropTypes.object,
};

export default Root;
