/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Grid, Switch, Tooltip } from '@material-ui/core';
import { Information } from 'mdi-material-ui';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import inject18n from '../../../../components/i18n';
import CyioCoreObjectLabelsView from '../../common/stix_core_objects/CyioCoreObjectLabelsView';

const styles = (theme) => ({
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '24px 24px 32px 24px',
    borderRadius: 6,
  },
  link: {
    textAlign: 'left',
    fontSize: '16px',
    font: 'DIN Next LT Pro',
  },
  chip: {
    color: theme.palette.header.text,
    height: 25,
    fontSize: 12,
    padding: '14px 12px',
    margin: '0 7px 7px 0',
    backgroundColor: theme.palette.header.background,
  },
  scrollBg: {
    background: theme.palette.header.background,
    width: '100%',
    color: 'white',
    padding: '10px 5px 10px 15px',
    borderRadius: '5px',
    lineHeight: '20px',
  },
  scrollDiv: {
    width: '100%',
    background: theme.palette.header.background,
    height: '100px',
    overflow: 'hidden',
    overflowY: 'scroll',
  },
  scrollObj: {
    color: theme.palette.header.text,
    fontFamily: 'sans-serif',
    padding: '0px',
    textAlign: 'left',
  },
  markingText: {
    background: theme.palette.header.text,
    color: 'black',
    width: '100px',
    textAlign: 'center',
    padding: '3px 0',
  },
  tooltip: { float: 'left', margin: '2px 0 0 5px' },
});

class AssessmentOverviewComponent extends Component {
  render() {
    const {
      t,
      classes,
      refreshQuery,
      assessment,
      fldt,
      history,
    } = this.props;
    console.log(assessment);
    return (
      <div style={{ height: '100%' }}>
        <Typography variant="h4" gutterBottom={true}>
          {t('Basic Information')}
        </Typography>
        <Paper classes={{ root: classes.paper }} elevation={2}>
          <Grid container={true} spacing={3}>
            <Grid item={true} xs={6}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('ID')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Uniquely identifies this object')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {assessment.id && (assessment.id)}
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Type')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Type')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {assessment.entity_type && t(assessment.entity_type)}
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Created')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Created')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {assessment.created && fldt(assessment.created)}
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Modified')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Modified')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {assessment.modified && fldt(assessment.modified)}
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: 'left' }}
              >
                {t('Description')}
              </Typography>
              <div className={classes.tooltip}>
                <Tooltip title={t('Description')}>
                  <Information fontSize='inherit' color='disabled' />
                </Tooltip>
              </div>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    <Markdown
                      remarkPlugins={[remarkGfm, remarkParse]}
                      rehypePlugins={[rehypeRaw]}
                      parserOptions={{ commonmark: true }}
                      className="markdown"
                    >
                      {assessment.description && t(assessment.description)}

                    </Markdown>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Authenticated')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Authenticated')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Typography>No</Typography>
                  <Switch disabled defaultChecked={assessment?.accepted} inputProps={{ 'aria-label': 'ant design' }} />
                  <Typography>Yes</Typography>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <CyioCoreObjectLabelsView
                labels={assessment.labels}
                marginTop={0}
                refreshQuery={refreshQuery}
                id={assessment.id}
                typename={assessment.__typename}
              />
            </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
}

AssessmentOverviewComponent.propTypes = {
  assessment: PropTypes.object,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

const AssessmentOverview = createFragmentContainer(
  AssessmentOverviewComponent,
  {
    assessment: graphql`
      fragment AssessmentOverview_data on Risk {
        __typename
        id
        created
        modified
        name
        description
        entity_type
        accepted
        labels {
          __typename
          id
          name
          color
          entity_type
          description
        }
      }
    `,
  },
);

export default compose(inject18n, withStyles(styles))(AssessmentOverview);
