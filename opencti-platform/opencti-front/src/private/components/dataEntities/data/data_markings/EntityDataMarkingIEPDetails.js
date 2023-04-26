import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Grid, Tooltip } from '@material-ui/core';
import { Information } from 'mdi-material-ui';
import Chip from '@material-ui/core/Chip';
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

const tlpColor = {
  red: '#FF2B2B',
  amber: '#FFC000',
  amber_strict: '#FFC000',
  green: '#33FF00',
  clear: '#FFFFFF',
};

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
                  {t('Start Date')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Indicates the date that the IEP is effective from. If none supplied, the IEP is applicable up until the end date.')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking.start_date
                  && fd(dataMarking.start_date)}
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
                  {t('End Date')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Indicates the date that the IEP is effective until. If none supplied, the IEP is applicable in perpetuity.')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking.end_date
                  && fd(dataMarking.end_date)}
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
                  {t('Encrypt In Transit')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('States whether the received information has to be encrypted when it is retransmitted by the recipient.')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking.encrypt_in_transit
                  && t(dataMarking.encrypt_in_transit)}
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
                  {t('Permitted Actions')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('States the permitted actions that Recipients can take upon information received.')}>
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
                  <Tooltip title={t('States whether recipients are permitted to notify affected third parties of a compromise or threat.')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.affected_party_notifications
                  && t(dataMarking.affected_party_notifications)}
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
                  <Tooltip title={t('States whether recipients are permitted to redistribute the information received within the redistribution scope as defined by the enumerations.')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                <Chip style={{
                  backgroundColor: '#000', borderRadius: 0, padding: 10, color: tlpColor[dataMarking?.tlp] || '#FF2B2B',
                }} size="small" label={dataMarking?.tlp && `TLP : ${t(dataMarking?.tlp).toUpperCase()}`} />
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
                {dataMarking?.iep_version && t(dataMarking.iep_version)}
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
                  <Tooltip title={t('States whether the recipient MAY or MUST NOT resell the information received unmodified or in a semantically equivalent format.')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.unmodified_resale
                  && t(dataMarking.unmodified_resale)}
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
                  {t('Provider Attribution')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('States whether recipients could be required to attribute or anonymize the Provider when redistributing the information received.')}>
                    <Information fontSize='inherit' color='disabled' />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {dataMarking?.attribution
                  && t(dataMarking.attribution)}
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
