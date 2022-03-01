/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Badge from '@material-ui/core/Badge';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import { InformationOutline, Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import inject18n from '../../../../components/i18n';
import ItemAuthor from '../../../../components/ItemAuthor';
import ItemMarking from '../../../../components/ItemMarking';
import ExpandableMarkdown from '../../../../components/ExpandableMarkdown';
import StixCoreObjectLabels from '../../common/stix_core_objects/StixCoreObjectLabels';
import CyioCoreObjectLabelsView from '../../common/stix_core_objects/CyioCoreObjectLabelsView';

const styles = (theme) => ({
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '24px 24px 32px 24px',
    borderRadius: 6,
  },
  chip: {
    color: theme.palette.header.text,
    height: 25,
    fontSize: 12,
    textAlign: 'left',
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
    height: '78px',
    overflow: 'hidden',
    overflowY: 'scroll',
  },
  scrollObj: {
    color: theme.palette.header.text,
    fontFamily: 'sans-serif',
    padding: '0px',
    textAlign: 'left',
  },
});

class RiskOverviewComponent extends Component {
  render() {
    const {
      t, fldt, classes, risk,
    } = this.props;
    // console.log('RiskOverview', risk);
    const riskEdges = R.pipe(
      R.pathOr([], ['related_risks', 'edges']),
      R.map((value) => ({
        priority: value.node.priority,
      })),
      R.mergeAll,
    )(risk);
    const relatedRiskData = R.pipe(
      R.pathOr([], ['related_risks', 'edges']),
      R.map((relatedRisk) => ({
        characterization: relatedRisk.node.characterizations,
      })),
      R.mergeAll,
      R.path(['characterization']),
      R.mergeAll,
    )(risk);
    const riskFacets = R.pipe(
      R.pathOr([], ['facets']),
      R.mergeAll,
    )(relatedRiskData);
    const objectLabel = { edges: { node: { id: 1, value: 'labels', color: 'red' } } };
    return (
      <div style={{ height: '100%' }} className="break">
        <Typography variant="h4" gutterBottom={true}>
          {t('Basic Information')}
        </Typography>
        {/*  <Paper classes={{ root: classes.paper }} elevation={2}>
          <Typography variant="h3" gutterBottom={true}>
            {t('Marking')}
          </Typography>
          {risk.objectMarking.edges.length > 0 ? (
            map(
              (markingDefinition) => (
                <ItemMarking
                  key={markingDefinition.node.id}
                  label={markingDefinition.node.definition}
                  color={markingDefinition.node.x_opencti_color}
                />
              ),
              risk.objectMarking.edges,
            )
          ) : (
            <ItemMarking label="TLP:WHITE" />
          )}
          <Typography
            variant="h3"
            gutterBottom={true}
            style={{ marginTop: 20 }}
          >
            {t('Creation date')}
          </Typography>
          {fldt(risk.created)}
          <Typography
            variant="h3"
            gutterBottom={true}
            style={{ marginTop: 20 }}
          >
            {t('Modification date')}
          </Typography>
          {fldt(risk.modified)}
          <Typography
            variant="h3"
            gutterBottom={true}
            style={{ marginTop: 20 }}
          >
            {t('Author')}
          </Typography>
          <ItemAuthor createdBy={propOr(null, 'createdBy', risk)} />
          <Typography
            variant="h3"
            gutterBottom={true}
            style={{ marginTop: 20 }}
          >
            {t('Description')}
          </Typography>
          <ExpandableMarkdown
            className="markdown"
            source={risk.description}
            limit={250}
          />
        </Paper> */}
        <Paper classes={{ root: classes.paper }} elevation={2}>
          <Grid container={true} spacing={3}>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: 'left' }}
              >
                {t('ID')}
              </Typography>
              <div style={{ float: 'left', marginLeft: '5px' }}>
                <Tooltip
                  title={t(
                    'ID',
                  )}
                >
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {risk.id && t(risk.id)}
            </Grid>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: 'left' }}
              >
                {t('POAM ID')}
              </Typography>
              <div style={{ float: 'left', marginLeft: '5px' }}>
                <Tooltip
                  title={t(
                    'POAM ID',
                  )}
                >
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {risk.poam_id && t(risk.poam_id)}
            </Grid>
          </Grid>
          <Grid style={{ marginTop: '10px' }} container={true} spacing={3}>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: 'left' }}
              >
                {t('Created')}
              </Typography>
              <div style={{ float: 'left', marginLeft: '5px' }}>
                <Tooltip
                  title={t(
                    'Created',
                  )}
                >
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {t('Jun 11, 2021, 9:14:22 AM')} */}
              {risk.created && t(risk.created)}
            </Grid>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: 'left' }}
              >
                {t('Last Modified')}
              </Typography>
              <div style={{ float: 'left', marginLeft: '5px' }}>
                <Tooltip
                  title={t(
                    'Last Modified',
                  )}
                >
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {t('Jun 11, 2021, 9:14:22 AM')} */}
              {risk.modified && t(risk.modified)}
            </Grid>
          </Grid>
          <Grid container={true} spacing={3}>
            <Grid style={{ marginTop: '10px' }} item={true} xs={12}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: 'left' }}
              >
                {t('Description')}
              </Typography>
              <div style={{ float: 'left', marginLeft: '5px' }}>
                <Tooltip
                  title={t(
                    'Description',
                  )}
                >
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {risk.description && t(risk.description)}
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
          <Grid container={true} spacing={3}>
            <Grid item={true} xs={6}>
              <div style={{ marginBottom: '58px', marginTop: '10px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Weakness')}
                </Typography>
                <div style={{ float: 'left', marginLeft: '5px' }}>
                  <Tooltip
                    title={t(
                      'Weakness',
                    )}
                  >
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {risk.name && t(risk.name)}
              </div>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left', marginTop: '10px' }}
                >
                  {t('Risk Rating')}
                </Typography>
                <div style={{ float: 'left', margin: '11px 0 0 5px' }}>
                  <Tooltip
                    title={t(
                      'Risk Rating',
                    )}
                  >
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {riskFacets.risk_name && t(riskFacets.risk_name)}
              </div>
              <div style={{ marginTop: '25px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Impact')}
                </Typography>
                <div style={{ float: 'left', marginLeft: '5px' }}>
                  <Tooltip
                    title={t(
                      'Version',
                    )}
                  >
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {riskFacets.name && t(riskFacets.name)}
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <div style={{ marginTop: '10px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Controls')}
                </Typography>
                <div style={{ float: 'left', marginLeft: '5px' }}>
                  <Tooltip
                    title={t(
                      'Controls',
                    )}
                  >
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                <Chip key={risk.id} classes={{ root: classes.chip }} label={t('Lorem Ipsum Dono Ist Sei')} color="primary" />
                <br />
                <Chip key={risk.id} classes={{ root: classes.chip }} label={t('Lorem Ipsum Dono Ist Sei')} color="primary" />
                {/* <ItemCreator creator={risk.creator} /> */}
              </div>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left', marginTop: 20 }}
                >
                  {t('Priority')}
                </Typography>
                <div style={{ float: 'left', margin: '21px 0 0 5px' }}>
                  <Tooltip
                    title={t(
                      'Priority',
                    )}
                  >
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {/* {risk.priority && t(risk.priority)} */}
                {riskEdges.priority && t(riskEdges.priority)}
              </div>
              <div style={{ marginBottom: '20px', marginTop: '25px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Likelihood')}
                </Typography>
                <div style={{ float: 'left', marginLeft: '5px' }}>
                  <Tooltip
                    title={t(
                      'Likelihood',
                    )}
                  >
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {t('Hello world')}
              </div>
            </Grid>
          </Grid>
          <Grid container={true} spacing={3}>
            <Grid item={true} xs={12}>
              <CyioCoreObjectLabelsView
                labels={risk.labels}
                marginTop={20}
                id={risk.id}
                typename={risk.__typename}
              />
            </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
}

RiskOverviewComponent.propTypes = {
  risk: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

const RiskOverview = createFragmentContainer(
  RiskOverviewComponent,
  {
    risk: graphql`
      fragment RiskOverview_risk on POAMItem {
        __typename
        id
        created
        modified
        poam_id     # Item ID
        name        # Weakness
        description
        labels {
          __typename
          id
          name
          color
          entity_type
          description
        }
        origins {
          id
          origin_actors {       # only use if UI support Detection Source
            actor_type
            actor {
              ... on Component {
                id
                name
              }
              ... on OscalParty {
                id
                name
              }
            }
          }
        }
        links {
          __typename
          id
          created
          modified
          entity_type
          external_id     # external id
          source_name     # Title
          description     # description
          url             # URL
          media_type      # Media Type
        }
        remarks {
          __typename
          id
          abstract
          content
          authors
        }
        related_risks {
          edges {
            node{
              id
              created
              modified
              name
              description
              statement
              risk_status       # Risk Status
              deadline
              priority
              impacted_control_id
              accepted
              false_positive    # False-Positive
              risk_adjusted     # Operational Required
              vendor_dependency # Vendor Dependency
              characterizations {
                origins {
                  id
                  origin_actors {
                    actor_type
                    actor {
                      ... on Component {
                        id
                        component_type
                        name          # Detection Source
                      }
                      ... on OscalParty {
                      id
                      party_type
                      name            # Detection Source
                      }
                    }
                  }
                }
                facets {
                  id
                  risk_state
                  source_system
                  ... on CustomFacet {
                    name
                    value
                  }
                  ... on RiskFacet {
                    risk_name: name
                    value
                  }
                  ... on VulnerabilityFacet {
                    vuln_name: name
                    value
                  }
                  ... on Cvss2Facet {
                    cvss2_name: name
                    value
                  }
                  ... on Cvss3Facet {
                    cvss3_name: name
                    value
                  }
                }
              }
              remediations {
                response_type
                lifecycle
              }
            }
          }
        }
      }
    `,
  },
);

export default R.compose(inject18n, withStyles(styles))(RiskOverview);