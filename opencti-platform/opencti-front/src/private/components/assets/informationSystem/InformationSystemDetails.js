/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Paper from '@material-ui/core/Paper';
import { Information } from 'mdi-material-ui';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import LaunchIcon from '@material-ui/icons/Launch';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import inject18n from '../../../../components/i18n';
import Switch from '@material-ui/core/Switch';
import { Button, Divider } from '@material-ui/core';

const styles = (theme) => ({
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '24px 24px 32px 24px',
    borderRadius: 6,
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
  link: {
    textAlign: 'left',
    fontSize: '1rem',
    display: 'flex',
    minWidth: '50px',
    width: '100%',
  },
  launchIcon: {
    marginRight: '5%',
  },
  linkTitle: {
    color: '#fff',
  }
});

class InformationSystemDetailsComponent extends Component {
  render() {
    const {
       t, classes, informationSystem,fldt, history
    } = this.props;
    return (
      <div style={{ height: "100%" }}>
        <Typography variant="h4" gutterBottom={true}>
          {t("Details")}
        </Typography>
        <Paper classes={{ root: classes.paper }} elevation={2}>
          <Grid container={true} spacing={3}>
            <Grid item={true} xs={12}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("Information Type(s)")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("Information Type(s)")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <IconButton size="small" style={{ margin: "-5px 0 0 5px" }}>
                <AddIcon />
              </IconButton>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* Content here */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("Security Sensitivity Level")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("Security Sensitivity Level")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* Content here */}
            </Grid>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("Security Impact Level")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("Security Impact Level")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <div className="clearfix" />
              {/* Content here */}
            </Grid>
            <Grid item={true} xs={12}>
              <Divider />
            </Grid> 
            <Grid item={true} xs={12}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("System Implementation")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("System Implementation")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
            </Grid>           
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("Inventory Items")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("Inventory Items")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <IconButton size="small" style={{ margin: "-5px 0 0 5px" }}>
                <AddIcon />
              </IconButton>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* Content here */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("Components")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("Components")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <IconButton size="small" style={{ margin: "-5px 0 0 5px" }}>
                <AddIcon />
              </IconButton>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* Content here */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("Users")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("Users")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <IconButton size="small" style={{ margin: "-5px 0 0 5px" }}>
                <AddIcon />
              </IconButton>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* Content here */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={6}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("Leveraged Authorization")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("Leveraged Authorization")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
              <IconButton size="small" style={{ margin: "-5px 0 0 5px" }}>
                <AddIcon />
              </IconButton>
              <div className="clearfix" />
              <div className={classes.scrollBg}>
                <div className={classes.scrollDiv}>
                  <div className={classes.scrollObj}>
                    {/* Content here */}
                  </div>
                </div>
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Divider />
            </Grid> 
            <Grid item={true} xs={12}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ float: "left" }}
              >
                {t("System Documentation")}
              </Typography>
              <div style={{ float: "left", margin: "-5px 0 0 5px" }}>
                <Tooltip title={t("System Documentation")}>
                  <Information fontSize="inherit" color="disabled" />
                </Tooltip>
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Button variant="contained" color="primary" endIcon={<KeyboardArrowDownIcon />} style={{ marginRight: 5 }}>
                Authorization Boundary
              </Button>
              <Button variant="contained" color="primary" endIcon={<KeyboardArrowDownIcon />} style={{ marginRight: 5 }}>
                Network Architecture
              </Button>
              <Button variant="contained" color="primary" endIcon={<KeyboardArrowDownIcon />} style={{ marginRight: 5 }}>
                Data Flow
              </Button>
            </Grid>      
          </Grid>
        </Paper>
      </div>
    );
  }
}

InformationSystemDetailsComponent.propTypes = {
  informationSystem: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  fld: PropTypes.func,
};

const InformationSystemDetails = createFragmentContainer(InformationSystemDetailsComponent, {
  informationSystem: graphql`
    fragment InformationSystemDetails_information on SoftwareAsset {
      id
      software_identifier
      license_key
      cpe_identifier
      patch_level
      installation_id
      implementation_point
      last_scanned
      is_scanned
      installed_on {
        id
        entity_type
        vendor_name
        name
        version
      }
      related_risks {
        id
        name
      }
    }
  `,
});

export default compose(inject18n, withStyles(styles))(InformationSystemDetails);
