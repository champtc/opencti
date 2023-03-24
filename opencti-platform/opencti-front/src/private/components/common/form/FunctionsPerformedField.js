import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  compose,
  uniq,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import {
  InputAdornment,
} from '@material-ui/core';
import { Field } from 'formik';
import inject18n from '../../../../components/i18n';

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
  titleIcon: {
    display: 'flex',
  },
  launchIcon: {
    marginRight: '10px',
  },
  dialogAction: {
    margin: '15px 20px 15px 0',
  },
  addIcon: {
    marginRight: '-20px',
    padding: '5px',
  },
});

class FunctionsPerformedField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      function: '',
      allFunctions: this.props.data ? [...this.props.data] : [],
      editingIndex: null,
    };
  }

  handleAddFunctionPerformed() {
    if (this.state.editingIndex !== null) {
      // Editing an existing function
      const newAllFunctions = [...this.state.allFunctions];
      newAllFunctions[this.state.editingIndex] = this.state.function;
      this.setState({
        allFunctions: newAllFunctions,
        function: '',
        editingIndex: null,
      }, () => this.props.setFieldValue(this.props.name, newAllFunctions));
    } else {
      // Adding a new function
      this.setState({
        allFunctions: uniq([...this.state.allFunctions, this.state.function]),
        function: '',
      }, () => this.props.setFieldValue(this.props.name, this.state.allFunctions));
    }
  }

  handleEdit(index) {
    const functionToEdit = this.state.allFunctions[index];
    this.setState({
      function: functionToEdit,
      editingIndex: index,
    });
  }

  handleDelete(index) {
    const newAllFunctions = [...this.state.allFunctions];
    newAllFunctions.splice(index, 1);
    this.setState({
      allFunctions: newAllFunctions,
    }, () => this.props.setFieldValue(this.props.name, newAllFunctions));
  }

  handleChange(event) {
    this.setState({
      function: event.target.value,
    });
  }

  render() {
    const {
      t,
      classes,
      title,
      name,
    } = this.props;
    return (
        <>
        <Typography
            variant="h3"
            color="textSecondary"
            gutterBottom={true}
            style={{ float: 'left' }}
          >
            {t(title)}
          </Typography>
          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
            <Tooltip title={t('Functions Performed')} >
              <Information fontSize="inherit" color="disabled" />
            </Tooltip>
          </div>
          <div className="clearfix" />
          <Field
            component={TextField}
            name={name}
            fullWidth={true}
            size="small"
            containerstyle={{ width: '100%' }}
            variant='outlined'
            value={this.state.function}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="open" size="large">
                    <AddIcon onClick={this.handleAddFunctionPerformed.bind(this)}/>
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onChange={this.handleChange.bind(this)}
          />
          <div className="clearfix" />
          <div style={{ marginTop: '20px' }}>
            <div className={classes.scrollBg}>
              <div className={classes.scrollDiv}>
                <div className={classes.scrollObj}>
                  {this.state.allFunctions !== [] && this.state.allFunctions.map((item, index) => (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p className={classes.contentText}>{item}</p>
                        <div>
                          <IconButton aria-label="open" size="medium" onClick={() => this.handleEdit(index)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton aria-label="open" size="medium" onClick={() => this.handleDelete(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      </div>
                      <br />
                    </>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
    );
  }
}

FunctionsPerformedField.propTypes = {
  name: PropTypes.string,
  device: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

export default compose(inject18n, withStyles(styles))(FunctionsPerformedField);
