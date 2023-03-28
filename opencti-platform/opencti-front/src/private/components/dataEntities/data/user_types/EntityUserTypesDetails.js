/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose, pathOr } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Grid, Tooltip } from '@material-ui/core';
import inject18n from '../../../../../components/i18n';
import AuthorizedPrivilegesPopover from './AuthorizedPrivilegesPopover';
import { Information } from 'mdi-material-ui';

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
  contentText: {
    marginTop: 0,
    marginBottom: 0,
  },
  tooltip: { float: 'left', margin: '2px 0 0 5px' },
});

class EntityUserTypesDetailsComponent extends Component {
  render() {
    const {
      t,
      classes,
      user,
    } = this.props;
    const roles = pathOr(
      [],
      ['roles'],
    )(user);
    return (
      <div style={{ height: '100%' }}>
        <Typography variant="h4" gutterBottom={true}>
          {t('Details')}
        </Typography>
        <Paper classes={{ root: classes.paper }} elevation={2}>
          <Grid container={true}>
            <Grid item xs={6}>
              <div>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Privilege Level')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Privilege Level')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                {user.privilege_level && t(user.privilege_level)}
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <div style={{ marginTop: '20px' }}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Role ID')}
                </Typography>
                <div className={classes.tooltip}>
                  <Tooltip title={t('Role ID')}>
                    <Information fontSize="inherit" color="disabled" />
                  </Tooltip>
                </div>
                <div className="clearfix" />
                <div className={classes.scrollBg}>
                  <div className={classes.scrollDiv}>
                    <div className={classes.scrollObj}>
                      {roles !== [] && roles.map((item) => (
                        <Typography>{t(item.name)}</Typography>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <AuthorizedPrivilegesPopover
                title={'Authorized Privileges'}
                name='authorized_privileges'
                userTypeId={user?.id}
                data={user.authorized_privileges}
              />
            </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
}

EntityUserTypesDetailsComponent.propTypes = {
  user: PropTypes.object,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

const EntityUserTypesDetails = createFragmentContainer(
  EntityUserTypesDetailsComponent,
  {
    user: graphql`
      fragment EntityUserTypesDetails_userType on OscalUser {
        __typename
        id
        entity_type
        created
        modified
        name
        description
        privilege_level
        authorized_privileges {
          id
          name
          description
          functions_performed
        }
        roles {
          name
          id
        }
      }
    `,
  },
);

export default compose(inject18n, withStyles(styles))(EntityUserTypesDetails);
