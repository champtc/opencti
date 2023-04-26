import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import { createFragmentContainer } from 'react-relay';
import { withStyles } from '@material-ui/core/styles/index';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import Grid from '@material-ui/core/Grid';
import { Link } from '@material-ui/core';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import LaunchIcon from '@material-ui/icons/Launch';
import FindInPageIcon from '@material-ui/icons/FindInPage';
import LayersIcon from '@material-ui/icons/Layers';
import MapIcon from '@material-ui/icons/Map';
import Divider from '@material-ui/core/Divider';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContentText from '@material-ui/core/DialogContentText';
import Slide from '@material-ui/core/Slide';
import inject18n from '../../../../components/i18n';
import ItemIcon from '../../../../components/ItemIcon';
import { truncate } from '../../../../utils/String';

const styles = (theme) => ({
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
    height: '35px',
    overflow: 'hidden',
    overflowY: 'scroll',
  },
  scrollObj: {
    color: theme.palette.header.text,
    fontFamily: 'sans-serif',
    padding: '0px',
    textAlign: 'left',
  },
  container: {
    margin: 0,
  },
  linkTitle: {
    color: '#fff',
    minWidth: 'fit-content',
    fontSize: '12px',
  },
  menuItem: {
    padding: '15px 0',
    width: '152px',
    margin: '0 20px',
    justifyContent: 'center',
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '10px 0 20px 22px',
  },
  buttonPopover: {
    textTransform: 'capitalize',
  },
  dialogContent: {
    overflowY: 'hidden',
    '@media (max-height: 1000px)': {
      overflowY: 'scroll',
    },
  },
  link: {
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    minWidth: '50px',
    width: '100%',
  },
  launchIcon: {
    marginRight: '1%',
  },
  popoverDialog: {
    fontSize: '18px',
    lineHeight: '24px',
    color: theme.palette.header.text,
  },
  observationHeading: {
    display: 'flex',
    alignItems: 'center',
    textTransform: 'uppercase',
  },
  statusButton: {
    cursor: 'default',
    background: '#075AD333',
    marginBottom: '5px',
    border: '1px solid #075AD3',
  },
  componentScroll: {
    height: '80px',
    overflowY: 'scroll',
  },
  observationContainer: {
    color: theme.palette.primary.text,
    display: 'flex',
    alignItems: 'center',
  },
  observationTitle: {
    marginRight: '15px',
  },
  componentContainer: {
    marginLeft: '15px',
    marginRight: '15px',
  },
  relevantContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  relevantContentBox: { display: 'flex', alignItems: 'center' },
  relevantTitle: {
    display: 'grid',
    gridTemplateColumns: '20% 1fr 1.5fr 0.5fr',
    width: '100%',
    padding: '10px 0 10px 12px',
  },
  relevantDisplay: {
    display: 'grid',
    gridTemplateColumns: '20% 1fr 1.5fr 0.5fr',
    width: '100%',
  },
});

const Transition = React.forwardRef((props, ref) => (
  <Slide direction='up' ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class RiskObservationPopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      displayUpdate: false,
      displayDelete: false,
      deleting: false,
    };
  }

  render() {
    const {
      classes, t, fd, data, handleCloseUpdate, history,
    } = this.props;
    // const subjectTypes = R.pipe(
    //   R.pathOr([], ['subjects']),
    //   // R.mergeAll,
    // )(data);
    return (
      <>
        <DialogTitle style={{ color: 'white', paddingBottom: 0 }}>
          {data.name && t(data.name)}
        </DialogTitle>
        <div style={{ marginLeft: '25px' }}>
          <Typography variant='caption'>
            {data.description && t(data.description)}
          </Typography>
        </div>
        <DialogContent classes={{ root: classes.dialogContent }}>
          <DialogContentText>
            <Grid style={{ margin: '25px 0' }} container={true} xs={12}>
              <Grid item={true} xs={3}>
                <Typography
                  className={classes.observationHeading}
                  color='textSecondary'
                  variant='h3'
                >
                  <AccessTimeIcon
                    fontSize='small'
                    style={{ marginRight: '8px' }}
                  />{' '}
                  When
                </Typography>
              </Grid>
              <Grid item={true} xs={9}>
                <Grid container={true}>
                  <Grid item={true} xs={6}>
                    <DialogContentText>{t('Collected')}</DialogContentText>
                    <Typography variang='h2' style={{ color: 'white' }}>
                      {data.collected && fd(data.collected)}
                    </Typography>
                  </Grid>
                  <Grid item={true} xs={6}>
                    <DialogContentText>
                      {t('Expiration Date')}
                    </DialogContentText>
                    <Typography variang='h2' style={{ color: 'white' }}>
                      {data.expires && fd(data.expires)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Divider />
          </DialogContentText>
          <DialogContentText>
            <Grid style={{ margin: '25px 0' }} container={true} xs={12}>
              <Grid item={true} xs={3}>
                <Typography
                  className={classes.observationHeading}
                  color='textSecondary'
                  variant='h3'
                >
                  <FindInPageIcon
                    fontSize='small'
                    style={{ marginRight: '8px' }}
                  />
                  How
                </Typography>
              </Grid>
              <Grid item={true} xs={9}>
                <DialogContentText>
                  {t('Source of Observation')}
                </DialogContentText>
                <div className={classes.scrollBg}>
                  <div className={classes.scrollDiv}>
                    <div className={classes.scrollObj}>
                      {data?.origins
                        && data.origins.map((value) => value.origin_actors.map((s, i) => (
                            <Link
                              key={i}
                              component='button'
                              variant='body2'
                              className={classes.link}
                              onClick={() => history.push(
                                `/data/entities/assessment_platform/${s.actor_ref.id}`,
                              )
                              }
                            >
                              <LaunchIcon
                                fontSize='small'
                                className={classes.launchIcon}
                              />
                              <div className={classes.linkTitle}>
                                {t(s.actor_ref.name)}
                              </div>
                            </Link>
                        )))}
                    </div>
                  </div>
                </div>
                <Grid
                  style={{ marginTop: '20px' }}
                  spacing={3}
                  container={true}
                >
                  <Grid item={true} xs={6}>
                    <DialogContentText>{t('Methods')}</DialogContentText>
                    {data?.methods
                      && data.methods.map((value, i) => (
                        <Button
                          variant='outlined'
                          size='small'
                          key={i}
                          style={{ margin: '1px' }}
                          className={classes.statusButton}
                        >
                          {value}
                        </Button>
                      ))}
                    <Typography
                      style={{ marginTop: '5px', textTransform: 'inherit' }}
                      variant='h4'
                    >
                      {t('A manual or automated test was performed.')}
                    </Typography>
                  </Grid>
                  <Grid item={true} xs={6}>
                    <DialogContentText>{t('Type')}</DialogContentText>
                    {data?.observation_types
                      && data.observation_types.map((value, i) => (
                        <Button
                          variant='outlined'
                          size='small'
                          key={i}
                          style={{ margin: '1px' }}
                          className={classes.statusButton}
                        >
                          {value}
                        </Button>
                      ))}
                    <Typography
                      style={{ marginTop: '5px', textTransform: 'inherit' }}
                      variant='h4'
                    >
                      {t(' An assessment finding made by a source.')}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Divider />
          </DialogContentText>

          <DialogContentText style={{ display: 'flex' }}>
            <Grid style={{ margin: '25px 0px' }} container={true} xs={12}>
              <Grid item={true} xs={2}>
              <Typography
                  className={classes.observationHeading}
                  color='textSecondary'
                  variant='h3'
                >
                  <MapIcon fontSize='small' style={{ marginRight: '8px' }} />
                  Where
                </Typography>
              </Grid>
              <Grid item={true} xs={4}>
                <DialogContentText>
                  {t('Observation Target(s)')}
                </DialogContentText>
                <div className={classes.scrollBg}>
                  <div className={classes.scrollDiv}>
                    <div className={classes.scrollObj}>
                      {data.subjects
                        && data.subjects.map((subject) => {
                          if (subject && subject.subject_context === 'target') {
                            return (
                              <div className={classes.observationContainer}>
                                <Link
                                  component='button'
                                  variant='body2'
                                  className={classes.link}
                                  onClick={() => history.push(
                                    `/defender_hq/assets/devices/${subject.subject_ref.id}`,
                                  )
                                  }
                                >
                                  <LaunchIcon
                                    fontSize='small'
                                    className={classes.launchIcon}
                                  />
                                  <div className={classes.linkTitle}>
                                    {t(subject.subject_ref.name)}
                                  </div>
                                </Link>
                              </div>
                            );
                          }
                          return <></>;
                        })}
                    </div>
                  </div>
                </div>
                </Grid>
              <Grid item={true} xs={2}>
                <Typography
                  className={classes.observationHeading}
                  color='textSecondary'
                  variant='h3'
                >
                  <LayersIcon fontSize='small' style={{ marginRight: '8px' }} />
                  What
                </Typography>
                </Grid>
              <Grid item={true} xs={4}>
                <DialogContentText>{t('Component(s)')}</DialogContentText>
                <div className={classes.scrollBg}>
                  <div className={classes.scrollDiv}>
                    <div className={classes.scrollObj}>
                      {data.subjects
                        && data.subjects.map((subject, i) => {
                          if (
                            subject
                            && subject.subject_context === 'secondary_target'
                          ) {
                            return (
                              <div className={classes.observationContainer}>
                                <div
                                  style={{
                                    height: '26px',
                                    padding: '0 10px 0 0',
                                    display: 'grid',
                                    placeItems: 'center',
                                  }}
                                >
                                  <ItemIcon
                                    key={i}
                                    type={subject.subject_type}
                                  />
                                </div>
                                <Link
                                  component='button'
                                  variant='body2'
                                  className={classes.link}
                                  onClick={() => history.push(
                                    `/defender_hq/assets/software/${subject.subject_ref.id}`,
                                  )
                                  }
                                >
                                  {t(subject.subject_ref.name)}
                                </Link>
                              </div>
                            );
                          }
                          return <></>;
                        })}
                    </div>
                  </div>
                </div>
                </Grid>
            </Grid>
            <Divider />
          </DialogContentText>
          <DialogContentText>
            <Grid style={{ margin: '25px 0' }} container={true} xs={12}>
              <div className={classes.relevantContainer}>
                <div className={classes.relevantContentBox}>
                  <Typography>{'Relevant Evidence'}</Typography>
                  <div style={{ float: 'left', margin: '5px 0 0 5px' }}>
                    <Tooltip title={t('Baseline Configuration Name')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                  <IconButton
                    size='small'
                    // onClick={this.handleCreateDiagram.bind(this)}
                    disabled={true}
                  >
                    <AddIcon fontSize='small' />
                  </IconButton>
                </div>
                <div className='clearfix' />
                <div className={classes.relevantTitle}>
                  <Typography>Title</Typography>
                  <Typography>Description</Typography>
                  <Typography>Referenced Attachment</Typography>
                </div>
              </div>
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {data.relevant_evidence
                      && data.relevant_evidence.map((evidence, key) => (
                        <div key={key} className={classes.relevantDisplay}>
                          <div>{evidence?.title && evidence?.title}</div>
                          <div>
                            {evidence?.description
                              && truncate(evidence?.description, 10)}
                          </div>
                          <Link
                            key={key}
                            component='button'
                            variant='body2'
                            className={classes.link}
                            rel='noopener noreferrer'
                            onClick={(event) => {
                              event.preventDefault();
                              window.open(evidence?.href, '_blank');
                            }}
                          >
                            <LaunchIcon
                              fontSize='small'
                              className={classes.launchIcon}
                            />
                            <div className={classes.linkTitle}>
                              {evidence?.href && evidence?.href}
                            </div>
                          </Link>
                          <div style={{ display: 'flex' }}>
                            <IconButton
                              size='small'
                              // onClick={this.handleOpenEdit.bind()}
                              disabled={true}
                            >
                              <EditIcon fontSize='small' />
                            </IconButton>
                            <IconButton
                              size='small'
                              // onClick={this.handleDeleteDialog.bind(this, key)}
                              disabled={true}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Grid>
            <Divider />
          </DialogContentText>
        </DialogContent>
        <DialogActions
          style={{
            marginLeft: '15px',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <Button onClick={() => handleCloseUpdate()} variant='outlined'>
            {t('Close')}
          </Button>
        </DialogActions>
      </>
    );
  }
}

RiskObservationPopover.propTypes = {
  displayUpdate: PropTypes.bool,
  handleCloseUpdate: PropTypes.func,
  data: PropTypes.object,
  paginationOptions: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  fd: PropTypes.func,
  handleRemove: PropTypes.func,
  history: PropTypes.object,
};

export const riskObservationPopoverQuery = graphql`
  query RiskObservationPopoverQuery($id: ID!) {
    observation(id: $id) {
      ...RiskObservationPopover_risk
    }
  }
`;

export const RiskObservationPopoverComponent = createFragmentContainer(
  RiskObservationPopover,
  {
    data: graphql`
      fragment RiskObservationPopover_risk on Observation {
        id
        entity_type
        name
        description
        methods
        observation_types
        collected
        relevant_evidence {
          href
          id
          description
          entity_type
          title
        }
        origins {
          origin_actors {
            # actor_type
            actor_ref {
              ... on AssessmentPlatform {
                id
                name
              }
              ... on Component {
                id
                component_type
                name
              }
              ... on OscalParty {
                id
                party_type
                name
              }
            }
          }
        }
        subjects {
          id
          entity_type
          name
          subject_context
          subject_type
          subject_ref {
            ... on Component {
              id
              entity_type
              name
            }
            ... on InventoryItem {
              id
              entity_type
              name
            }
            ... on OscalLocation {
              id
              entity_type
              name
            }
            ... on OscalParty {
              id
              entity_type
              name
            }
            ... on OscalUser {
              id
              entity_type
              name
            }
          }
        }
      }
    `,
  },
);

export default R.compose(
  inject18n,
  withStyles(styles),
)(RiskObservationPopoverComponent);
