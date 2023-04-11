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
import { Grid, Tooltip } from '@material-ui/core';
import { Information } from 'mdi-material-ui';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import inject18n from '../../../../../components/i18n';
import CyioCoreObjectLabelsView from '../../../common/stix_core_objects/CyioCoreObjectLabelsView';

const styles = (theme) => ({
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '24px 24px 0 24px',
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
  textBase: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 5,
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
    height: '93px',
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

class EntityDataMarkingOverview extends Component {
  render() {
    const { t, classes, refreshQuery, dataMarking, fldt } = this.props;
    return (
      <div style={{ height: '100%' }}>
        <Typography variant='h4' gutterBottom={true}>
          {t('Basic Information')}
        </Typography>
        <Paper classes={{ root: classes.paper }} elevation={2}>
          <Grid container={true}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <div>
                  <Typography
                    variant='h3'
                    color='textSecondary'
                    style={{ float: 'left' }}
                  >
                    {t('ID')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Uniquely identifies this object')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                  <div className='clearfix' />
                  {dataMarking?.id && t(dataMarking.id)}
                </div>
              </Grid>
              <Grid item xs={6}>
                <div style={{ marginTop: '20px' }}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
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
                  <div className='clearfix' />
                  {dataMarking?.created && fldt(dataMarking.created)}
                </div>
              </Grid>
              <Grid item xs={6}>
                <div style={{ marginTop: '20px' }}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Last Modified')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Last Modified')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                  <div className='clearfix' />
                  {dataMarking?.modified && fldt(dataMarking.modified)}
                </div>
              </Grid>
              <Grid item={true} xs={12}>
                <div style={{ marginTop: '20px' }}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
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
                  <div className='clearfix' />
                  <div className={classes.scrollBg}>
                    <div className={classes.scrollDiv}>
                      <div className={classes.scrollObj}>
                        <Markdown
                          remarkPlugins={[remarkGfm, remarkParse]}
                          rehypePlugins={[rehypeRaw]}
                          parserOptions={{ commonmark: true }}
                          className='markdown'
                        >
                          {dataMarking?.description &&
                            t(dataMarking.description)}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              </Grid>
              {dataMarking.definition_type === 'iep' && <Grid item={true} xs={12}>
                <div style={{ marginTop: '20px' }}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Markings Type')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Markings Type')}>
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <div className='clearfix' />
                  {dataMarking?.definition_type && t(dataMarking.definition_type)}
                </div>
              </Grid>}              
              <Grid item={true} xs={12}>
                <CyioCoreObjectLabelsView
                  labels={[]}
                  marginTop={0}
                  refreshQuery={refreshQuery}
                  id={dataMarking.id}
                  typename={dataMarking.__typename}
                />
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
}

EntityDataMarkingOverview.propTypes = {
  dataMarking: PropTypes.object,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles)
)(EntityDataMarkingOverview);
