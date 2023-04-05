import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import { Information } from 'mdi-material-ui';
import {
  Tooltip,
  Button,
  DialogTitle,
  Typography,
  DialogContent,
  DialogActions,
  Grid,
} from '@material-ui/core';
import inject18n from '../../../../../components/i18n';

const styles = (theme) => ({
  container: {
    margin: 0,
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
  dialogTitle: {
    padding: '24px 0 16px 24px',
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '10px 0 20px 22px',
  },
  buttonPopover: {
    textTransform: 'capitalize',
  },
  dialogContent: {
    padding: '0 24px',
    marginBottom: '24px',
    overflowY: 'scroll',
  },
});

class InformationSystemGraphComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayCreate: '',
    };
  }

  render() {
    const {
      t,
      classes,
      openDetails,
      informationSystem,
      handleChangeDetails,
    } = this.props;
    return (
      <>
        <DialogTitle classes={{ root: classes.dialogTitle }}>
          {t('Information Type')}
        </DialogTitle>
        <DialogContent classes={{ root: classes.dialogContent }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Name')}
                </Typography>
                <Tooltip
                  title={t(
                    'Name',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={12}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Description')}
                </Typography>
                <Tooltip
                  title={t(
                    'Description',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* {informationType.description && t(informationType.description)} */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item xs={4}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Categorization System')}
                </Typography>
                <Tooltip
                  title={t(
                    'Categorization System',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={4}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Category')}
                </Typography>
                <Tooltip
                  title={t(
                    'Category',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={4}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Information Type')}
                </Typography>
                <Tooltip
                  title={t(
                    'Information Type',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={12} className={classes.textBase}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ margin: 0 }}
              >
                {t('Confidentiality Impact')}
              </Typography>
              <Tooltip
                title={t(
                  'Confidentiality Impact',
                )}
              >
                <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
              </Tooltip>
            </Grid>
            <Grid item xs={3}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Base')}
                </Typography>
                <Tooltip
                  title={t(
                    'Base',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={3}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Selected')}
                </Typography>
                <Tooltip
                  title={t(
                    'Selected',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={6}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Justification')}
                </Typography>
                <Tooltip
                  title={t(
                    'Justification',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* {informationType.description && t(informationType.description)} */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item xs={12} className={classes.textBase}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ margin: 0 }}
              >
                {t('Integrity Impact')}
              </Typography>
              <Tooltip
                title={t(
                  'Integrity Impact',
                )}
              >
                <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
              </Tooltip>
            </Grid>
            <Grid item xs={3}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Base')}
                </Typography>
                <Tooltip
                  title={t(
                    'Base',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={3}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Selected')}
                </Typography>
                <Tooltip
                  title={t(
                    'Selected',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={6}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Justification')}
                </Typography>
                <Tooltip
                  title={t(
                    'Justification',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* {informationType.description && t(informationType.description)} */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item xs={12} className={classes.textBase}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ margin: 0 }}
              >
                {t('Availability Impact')}
              </Typography>
              <Tooltip
                title={t(
                  'Availability Impact',
                )}
              >
                <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
              </Tooltip>
            </Grid>
            <Grid item xs={3}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Base')}
                </Typography>
                <Tooltip
                  title={t(
                    'Base',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={3}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Selected')}
                </Typography>
                <Tooltip
                  title={t(
                    'Selected',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* {informationType.first_seen && fldt(informationType.first_seen)} */}
            </Grid>
            <Grid item xs={6}>
              <div className={classes.textBase}>
                <Typography
                  variant="h3"
                  color="textSecondary"
                  gutterBottom={true}
                  style={{ margin: 0 }}
                >
                  {t('Justification')}
                </Typography>
                <Tooltip
                  title={t(
                    'Justification',
                  )}
                >
                  <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* {informationType.description && t(informationType.description)} */}
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions classes={{ root: classes.dialogActions }}>
          <Button
            onClick={() => handleChangeDetails()}
            classes={{ root: classes.buttonPopover }}
            variant='outlined'
            size='large'
          >
            {t('Cancel')}
          </Button>
        </DialogActions>
      </>
    );
  }
}

InformationSystemGraphComponent.propTypes = {
  t: PropTypes.func,
  classes: PropTypes.object,
  openDetails: PropTypes.bool,
  handleChangeDetails: PropTypes.func,
};

const InformationSystemGraph = createFragmentContainer(InformationSystemGraphComponent, {
  informationSystem: graphql`
    fragment InformationSystemGraphDetails_information on InformationSystem {
      id
      short_name
      system_name
      description
    }
  `,
});

export default compose(inject18n, withStyles(styles))(InformationSystemGraph);
