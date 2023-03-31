import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Grid, Tooltip } from '@material-ui/core';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import { Information } from 'mdi-material-ui';
import inject18n from '../../../../../components/i18n';
import RiskLevel from '../../../common/form/RiskLevel';

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
    height: '90px',
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

class EntityInformationTypeDetailsComponent extends Component {
  render() {
    const {
      t, classes, informationType,
    } = this.props;
    return (
      <div style={{ height: '100%' }}>
        <Typography variant="h4" gutterBottom={true}>
          {t('Details')}
        </Typography>
        <Paper classes={{ root: classes.paper }} elevation={2}>
          <Grid container={true}>
            <Grid item xs={4}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Categorization System')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Categorization System')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType?.categorizations?.information_type?.title
                  && t(informationType?.categorizations?.information_type?.title)}
              </div>
            </Grid>
            <Grid item xs={4}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Category')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Category')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType.category && t(informationType.category)}
              </div>
            </Grid>
            <Grid item xs={4}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Information Type')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Information Type')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType.category && t(informationType.category)}
              </div>
            </Grid>
            <Grid item xs={12}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Confidentiality Impact')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Confidentiality Impact')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
              </div>
            </Grid>
            <Grid item xs={2}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Base')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Base')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType?.confidentiality_impact?.base_impact && (
                  <RiskLevel
                    risk={informationType?.confidentiality_impact?.base_impact}
                  />
                )}
              </div>
            </Grid>
            <Grid item xs={4}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Selected')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Selected')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType?.confidentiality_impact?.selected_impact && (
                  <RiskLevel
                    risk={
                      informationType?.confidentiality_impact?.selected_impact
                    }
                  />
                )}
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div style={{ marginTop: '20px' }}>
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
                    <Information fontSize="inherit" color="disabled" />
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
                        {informationType?.confidentiality_impact
                          ?.adjustment_justification
                          && t(
                            informationType?.confidentiality_impact
                              ?.adjustment_justification,
                          )}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item xs={12}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Integrity Impact')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Integrity Impact')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
              </div>
            </Grid>
            <Grid item xs={2}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Base')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Base')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType?.integrity_impact?.base_impact
                  && <RiskLevel risk={informationType?.integrity_impact?.base_impact}/>}
              </div>
            </Grid>
            <Grid item xs={4}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Selected')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Selected')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType?.integrity_impact?.selected_impact
                  && <RiskLevel risk={informationType?.integrity_impact?.selected_impact}/>}
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Justification')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Justification')}>
                    <Information fontSize="inherit" color="disabled" />
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
                        {informationType?.integrity_impact
                          ?.adjustment_justification
                          && t(
                            informationType?.integrity_impact
                              ?.adjustment_justification,
                          )}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item xs={12}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Availability Impact')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Availability Impact')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
              </div>
            </Grid>
            <Grid item xs={2}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Base')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Base')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType?.availability_impact?.base_impact
                  && <RiskLevel risk={informationType?.availability_impact?.base_impact}/>}
              </div>
            </Grid>
            <Grid item xs={4}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Selected')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Selected')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {informationType?.availability_impact?.selected_impact
                  && <RiskLevel risk={informationType?.availability_impact?.selected_impact}/>}
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Justification')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Justification')}>
                    <Information fontSize="inherit" color="disabled" />
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
                        {informationType?.availability_impact
                          ?.adjustment_justification
                          && t(
                            informationType?.availability_impact
                              ?.adjustment_justification,
                          )}
                      </Markdown>
                    </div>
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

EntityInformationTypeDetailsComponent.propTypes = {
  informationType: PropTypes.object,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

const EntityInformationTypeDetails = createFragmentContainer(
  EntityInformationTypeDetailsComponent,
  {
    informationType: graphql`
      fragment EntityInformationTypeDetails_informationType on InformationType {
        id
        title
        category
        modified
        created
        entity_type
        categorizations {
          entity_type
          id
          information_type {
            title
            id
          }
        }
        confidentiality_impact {
          base_impact
          selected_impact
          adjustment_justification
        }
        availability_impact {
          base_impact
          adjustment_justification
          selected_impact
        }
        integrity_impact {
          adjustment_justification
          base_impact
          selected_impact
        }
      }
    `,
  },
);

export default compose(
  inject18n,
  withStyles(styles),
)(EntityInformationTypeDetails);
