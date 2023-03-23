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

class EntityLeveragedAuthorizationDetailsComponent extends Component {
  render() {
    const {
      t,
      classes,
      leveragedAuthorization,
      fd,
    } = this.props;
    return (
      <div style={{ height: '100%' }}>
        <Typography variant="h4" gutterBottom={true}>
          {t('Details')}
        </Typography>
        <Paper classes={{ root: classes.paper }} elevation={2}>
        <Grid container={true}>
          <Grid container item xs={8} spacing={1}>
            <Grid container item xs={12} spacing={1}>
              <Grid item xs={6}>
                <div>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Date Authorized')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Date Authorized')}>
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <div className="clearfix" />
                  {leveragedAuthorization.date_authorized
                  && fd(leveragedAuthorization.date_authorized)}
                </div>
              </Grid>
              <Grid item xs={6}>
                <div>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Party')}
                  </Typography>
                  <div className={classes.tooltip}>
                    <Tooltip title={t('Party')}>
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <div className="clearfix" />
                  {leveragedAuthorization.party.name && t(leveragedAuthorization.party.name)}
                </div>
              </Grid>
            </Grid>
          </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
}

EntityLeveragedAuthorizationDetailsComponent.propTypes = {
  leveragedAuthorization: PropTypes.object,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

const EntityLeveragedAuthorizationDetails = createFragmentContainer(
  EntityLeveragedAuthorizationDetailsComponent,
  {
    leveragedAuthorization: graphql`
      fragment EntityLeveragedAuthorizationDetails_leveragedAuthorization on OscalLeveragedAuthorization {
        date_authorized
        party {
          id
          name
        }
      }
    `,
  },
);

export default compose(inject18n, withStyles(styles))(EntityLeveragedAuthorizationDetails);
