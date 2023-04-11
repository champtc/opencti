import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Grid, Tooltip } from '@material-ui/core';
import { Information } from 'mdi-material-ui';
import inject18n from '../../../../../components/i18n';

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
    height: '223px',
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

class EntityDataMarkingIEPDetails extends Component {
  render() {
    const {
      t, classes, dataMarking, fd,
    } = this.props;
    return (
      <div style={{ height: '100%' }}>
        <Typography variant='h4' gutterBottom={true}>
          {t('Details')}
        </Typography>
        <Paper classes={{ root: classes.paper }} elevation={2}>
          <Grid container={true}>
            <Grid item xs={6}>
              <div>
                <Typography
                  variant='h3'
                  color='textSecondary'
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Encrypt In Transit')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Encrypt In Transit')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking.encrypt_in_transit
                  && fd(dataMarking.encrypt_in_transit)}
              </div>
            </Grid>
            <Grid item xs={6}>
              <div>
                <Typography
                  variant='h3'
                  color='textSecondary'
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Permitted Actions')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Permitted Actions')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.permitted_actions
                  && t(dataMarking.permitted_actions)}
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
                  {t('Affected Party Notifications')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Affected Party Notifications')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.affected_party_notifications
                  && fd(dataMarking.affected_party_notifications)}
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
                  {t('Sharing')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Sharing')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.tlp && t(dataMarking.tlp)}
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
                  {t('IEP Version')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('IEP Version')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.iep_version && fd(dataMarking.iep_version)}
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
                  {t('Unmodified Resale')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Unmodified Resale')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.unmodified_resale
                  && t(dataMarking.unmodified_resale)}
              </div>
            </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
}

EntityDataMarkingIEPDetails.propTypes = {
  dataMarking: PropTypes.object,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles),
)(EntityDataMarkingIEPDetails);
