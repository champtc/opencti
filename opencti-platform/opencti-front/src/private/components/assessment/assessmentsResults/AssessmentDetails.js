import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {
  Divider,
  Grid,
  Tooltip,
} from '@material-ui/core';
import { Information } from 'mdi-material-ui';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import inject18n from '../../../../components/i18n';

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
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnViewContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 0.5fr',
  },
  tooltip: { float: 'left', margin: '2px 0 0 5px' },
});

class AssessmentDetailsComponent extends Component {
  render() {
    const {
      t,
      classes,
      assessment,
      fd,
    } = this.props;
    return (
      <div style={{ height: '100%' }}>
        <Typography variant="h4" gutterBottom={true}>
          {t('Details')}
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
                  {t('Assessment Start Date')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Assessment Start Date')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {assessment.created && fd(assessment.created)}
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
                  {t('Assessment End Date')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Assessment End Date')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {assessment.modified && fd(assessment.modified)}
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Divider />
            </Grid>
            <Grid item={true} xs={6}>
              <div className={classes.titleContainer}>
                <div>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Inventory Items')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Inventory Items')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                </div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                >
                  {t('New')}
                </Typography>
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
                      {/* {assessment.description && t(assessment.description)} */}
                    </Markdown>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div className={classes.titleContainer}>
                <div>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Components')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Components')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                </div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                >
                  {t('New')}
                </Typography>
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
                      {/* {assessment.description && t(assessment.description)} */}
                    </Markdown>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Divider />
            </Grid>
            <Grid item={true} xs={12}>
              <div className={classes.columnViewContainer}>
                <div>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Observations')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Observations')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                </div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Collected')}
                </Typography>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Method')}
                </Typography>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Source')}
                </Typography>
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
                      {/* {assessment.description && t(assessment.description)} */}
                    </Markdown>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Divider />
            </Grid>
            <Grid item={true} xs={12}>
            <div className={classes.columnViewContainer}>
                <div>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Findings')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Findings')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                </div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Target')}
                </Typography>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Status')}
                </Typography>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Source')}
                </Typography>
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
                      {/* {assessment.description && t(assessment.description)} */}
                    </Markdown>
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
}

AssessmentDetailsComponent.propTypes = {
  assessment: PropTypes.object,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

const AssessmentDetails = createFragmentContainer(
  AssessmentDetailsComponent,
  {
    assessment: graphql`
      fragment AssessmentDetails_data on Risk {
        __typename
        id
        created
        modified
        name
        description
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

export default compose(inject18n, withStyles(styles))(AssessmentDetails);
