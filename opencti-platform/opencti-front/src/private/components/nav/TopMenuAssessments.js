import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import inject18n from '../../../components/i18n';

const styles = (theme) => ({
  buttonHome: {
    marginRight: theme.spacing(2),
    padding: '4px 5px',
    minHeight: 20,
    textTransform: 'none',
  },
  button: {
    marginRight: theme.spacing(1),
    padding: '4px 25px',
    minHeight: 20,
    minWidth: 20,
    textTransform: 'none',
  },
  arrow: {
    verticalAlign: 'middle',
    marginRight: 10,
  },
  icon: {
    marginRight: theme.spacing(1),
  },
});

class TopMenuDataAssessments extends Component {
  render() {
    const {
      t,
      location,
      match: {
        params: { assessmentId },
      },
      classes,
    } = this.props;
    return (
      <>
        <Button
          component={Link}
          to='/activities/assessments/assessment_results'
          variant='contained'
          color='primary'
          classes={{ root: classes.buttonHome }}
        >
          {t('Assessments')}
        </Button>
        {assessmentId && (
          <>
            <ChevronRightIcon
              classes={{ root: classes.arrow }}
            />
            <Button
              component={Link}
              to={`/activities/assessments/assessment_results/${assessmentId}`}
              variant={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}`
                  ? 'contained'
                  : 'text'
              }
              size="small"
              color={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}`
                  ? 'secondary'
                  : 'inherit'
              }
              classes={{ root: classes.button }}
            >
              {t('Overview')}
            </Button>
            <Button
              component={Link}
              to={`/activities/assessments/assessment_results/${assessmentId}/knowledge`}
              variant={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}/knowledge`
                  ? 'contained'
                  : 'text'
              }
              size="small"
              color={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}/knowledge`
                  ? 'secondary'
                  : 'inherit'
              }
              classes={{ root: classes.button }}
            >
              {t('Knowledge')}
            </Button>
            <Button
              component={Link}
              to={`/activities/assessments/assessment_results/${assessmentId}/analysis`}
              variant={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}/analysis`
                  ? 'contained'
                  : 'text'
              }
              size="small"
              color={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}/analysis`
                  ? 'secondary'
                  : 'inherit'
              }
              classes={{ root: classes.button }}
            >
              {t('Analysis')}
            </Button>
            <Button
              component={Link}
              to={`/activities/assessments/assessment_results/${assessmentId}/activities`}
              variant={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}/activities`
                  ? 'contained'
                  : 'text'
              }
              size="small"
              color={
                location.pathname
                  === `/activities/assessments/assessment_results/${assessmentId}/activities`
                  ? 'secondary'
                  : 'inherit'
              }
              classes={{ root: classes.button }}
            >
              {t('Activities')}
            </Button>
          </>
        )}
      </>
    );
  }
}

TopMenuDataAssessments.propTypes = {
  classes: PropTypes.object,
  location: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
};

export default compose(
  inject18n,
  withRouter,
  withStyles(styles),
)(TopMenuDataAssessments);
