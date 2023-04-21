/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Field, Form, Formik } from 'formik';
import * as R from 'ramda';
import {
    compose,
    map,
    pipe,
    pathOr,
    filter,
    prop,
    includes,
  } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import Delete from '@material-ui/icons/Delete';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import graphql from 'babel-plugin-relay/macro';
import TextField from '@material-ui/core/TextField';
import { Edit } from '@material-ui/icons';
import Link from '@material-ui/core/Link';
import LaunchIcon from '@material-ui/icons/Launch';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { Dialog, DialogContent, DialogActions, Select, MenuItem, Input, InputLabel, FormControl } from '@material-ui/core';
import NewTextField from '../../../../components/TextField';
import inject18n from '../../../../components/i18n';
import { commitMutation, fetchQuery } from '../../../../relay/environment';
import SelectField from '../../../../components/SelectField';


const styles = (theme) => ({
    paper: {
      height: '100%',
      minHeight: '100%',
      margin: '10px 0 0 0',
      padding: '15px',
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
      height: '85px',
      overflow: 'hidden',
      overflowY: 'scroll',
    },
    scrollObj: {
      color: theme.palette.header.text,
      fontFamily: 'sans-serif',
      padding: '0px',
      textAlign: 'left',
    },
    descriptionBox: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inputTextField: {
      color: 'white',
    },
    textField: {
      background: theme.palette.header.background,
    },
    dialogAction: {
      margin: '15px 20px 15px 0',
    },
  });

const responsibilityFieldQuery = graphql`
  query ResponsibilityFieldQuery{
    oscalRoles {
        edges {
          node {
            id
            name
            role_identifier
          }
        }
      }
  }
`;

class ResponsibilityField extends Component {
  constructor(props) {
    super(props);
    this.state = {
        open: false,
        error: false,
        parties: [],
        currentRoles: this.props.data ? [...this.props.data] : [],
        party: this.props.selectedRoles ? [...this.props.selectedRoles] : [],
        RolesFieldList: [],
    };
  }

  componentDidMount() {
    fetchQuery(responsibilityFieldQuery)
      .toPromise()
      .then((data) => {
        const RolesFieldEntities = R.pipe(
          R.pathOr([], ['oscalRoles', 'edges']),
          R.map((n) => ({
            id: n.node.id,
            role: n.node.role_identifier,
            name: n.node.name,
          })),
          R.sortBy(R.prop('name')),
        )(data);
        this.setState({
          RolesFieldList: RolesFieldEntities,
        });
      })
  }

  handleAdd() {
    const list = this.state.party.length === 0 ? [] : filter(pipe(prop('id'), includes(R.__, this.state.party)), this.state.RolesFieldList)
    this.setState({
        currentRoles: list.length === 0 ? [] : [...this.state.currentRoles, ...list],
        open: false,
    });
    this.props.setFieldValue('roles', this.state.party)
  }

  handleDelete(key) {
    this.setState({
        currentRoles: R.reject(R.propEq('id', key), this.state.currentRoles),
        party: R.filter((n) => n !== key, this.state.party),
    }, () => this.props.setFieldValue('roles', this.state.party));
  }

  handleChange(event) {
    const arr = event.target.value;
    this.setState({party: [...arr]})
  }

  render() {
    const {
      t,
      classes,
      name,
      history,
      title,
      helperText,
      containerstyle,
      style,
      label,
      variant,
      size,
      multiple,
      disabled,
    } = this.props;
    return (
      <>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Typography>{title && t(title)}</Typography>
          <div style={{ float: "left", margin: "5px 0 0 5px" }}>
            <Tooltip title={t("Baseline Configuration Name")}>
              <Information fontSize="inherit" color="disabled" />
            </Tooltip>
          </div>
          <IconButton
            size="small"
            onClick={() => this.setState({ open: true })}
          >
            <InsertLinkIcon />
          </IconButton>
        </div>
        <div className={classes.scrollBg}>
          <div className={classes.scrollDiv}>
            <div className={classes.scrollObj}>
              {this.state.currentRoles &&
                this.state.currentRoles.map((role, key) => (
                  <div key={key} className={classes.descriptionBox}>
                    <Typography>{role && t(role?.name)}</Typography>
                    <IconButton
                      size="small"
                      onClick={this.handleDelete.bind(this, role.id)}
                    >
                      <LinkOffIcon />
                    </IconButton>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <Dialog open={this.state.open} fullWidth={true} maxWidth="sm">
          <DialogContent>{title && t(title)}</DialogContent>
          <DialogContent style={{ overflow: "hidden" }}>
            <Field
                component={Select}
                name={name}
                label={label}
                fullWidth={true}
                multiple={multiple}
                containerstyle={containerstyle}
                variant={variant}
                disabled={disabled || false}
                size={size}
                style={style}
                helperText={helperText}
                value={this.state.party}
                onChange={this.handleChange.bind(this)}
            >
                {this.state.RolesFieldList !== [] && this.state.RolesFieldList.map((resp, key) => (
                    resp.id
                    && <MenuItem key={resp.id} value={resp.id}>
                    {resp.name}
                    </MenuItem>
                ))}
            </Field>
          </DialogContent>
          <DialogActions className={classes.dialogAction}>
            <Button
              variant="outlined"
              onClick={() => this.setState({ open: false })}
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={this.handleAdd.bind(this)}
              color="primary"
              disabled={this.state.party === null}
            >
              {t("Add")}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

ResponsibilityField.propTypes = {
  name: PropTypes.string,
  device: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

export default compose(inject18n, withStyles(styles))(ResponsibilityField);
