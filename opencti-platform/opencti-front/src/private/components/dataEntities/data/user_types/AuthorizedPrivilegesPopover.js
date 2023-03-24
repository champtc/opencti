/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import * as Yup from 'yup';
import { Formik, Form, Field } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import Delete from '@material-ui/icons/Delete';
import Edit from '@material-ui/icons/Edit';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { Dialog, DialogContent, DialogActions, DialogTitle, Grid, InputAdornment } from '@material-ui/core';
import graphql from 'babel-plugin-relay/macro';
import inject18n from '../../../../../components/i18n';
import DataAddressField from '../../../common/form/DataAddressField';
import { commitMutation } from '../../../../../relay/environment';
import MarkDownField from '../../../../../components/MarkDownField';
import TextField from '../../../../../components/TextField';
import FunctionsPerformedField from '../../../common/form/FunctionsPerformedField';
import { adaptFieldValue } from '../../../../../utils/String';

const styles = (theme) => ({
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '15px',
    borderRadius: 6,
  },
  dataEntities: {
    width: '150px',
  },
  dataSelect: {
    display: 'flex',
    alignItems: 'center',
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
    height: '65px',
    overflow: 'hidden',
    overflowY: 'scroll',
  },
  scrollObj: {
    color: theme.palette.header.text,
    fontFamily: 'sans-serif',
    padding: '0px',
    textAlign: 'left',
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

const authorizedPrivilegesPopoverMutation = graphql`
  mutation AuthorizedPrivilegesPopoverMutation(
    $id: ID!,
    $input: [EditInput]!
  ) {
    editAuthorizedPrivilege(id: $id, input: $input) {
      id
    }
  }
`;

const  AuthorizedPrivilegeCreationValidation = (t) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
  // functions_performed: Yup.string().nullable(),
});

class AuthorizedPrivilegesPopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      openEdit: false,
      authorizedPrivileges: this.props.data ? [...this.props.data] : [],
      id: '',
      name: '',
      description: '',
      functionsPerformed: null,
      editIndex: null
    };
  }

  onSubmit(values, { setSubmitting, resetForm }) {
    const authorizedPrivilege = {
      name: values.name || '',
      description: values.description || '',
      functions_performed: values.functions_performed || [],
    }
    this.setState({ 
      authorizedPrivileges: [...this.state.authorizedPrivileges, authorizedPrivilege],
      open: false,
    }, () => this.props.setFieldValue(this.props.name, this.state.authorizedPrivileges))
    resetForm();
  }

  handleClose() {
    this.setState({
      open: false,
    })
  }
  
  handleEditClose() {
    this.setState({
      openEdit: false,
    })
  }

  handleEditSubmit(values, { setSubmitting, resetForm }) {
    const finalValues = R.pipe(
      R.toPairs,
      R.map((n) => ({
        'key': n[0],
        'value': adaptFieldValue(n[1]),
      })),
    )(values);

    this.state.id !== '' && commitMutation({
      mutation: authorizedPrivilegesPopoverMutation,
      variables: {
        input: finalValues,
      },
      setSubmitting,
      // pathname: '/data/entities/notes',
      onCompleted: () => {
        setSubmitting(false);
        resetForm();
        this.setState({
          openEdit: false,
        })
      },
      onError: () => {
        toastGenericError('Failed to create location');
      },
    });

    const updatedPrivileges = [...this.state.authorizedPrivileges];
      updatedPrivileges[editIndex] = { name: this.state.name, description: this.state.description, functions_performed: this.state.functionsPerformed };
      this.setState({ authorizedPrivileges: updatedPrivileges, name: "", description: "", openEdit: false, editIndex: null });
  }

  handleEdit(index, id) {
    const authorizedPrivilege = this.state.authorizedPrivileges[index];
    console.log(authorizedPrivilege);
    this.setState({
      openEdit: true,
      id: authorizedPrivilege?.id || '',
      name: authorizedPrivilege.name,
      description: authorizedPrivilege.description,
      functionsPerformed: authorizedPrivilege.functions_performed,
    })
  }

  render() {
    const {
      t, fldt, classes, name, title, helperText,
    } = this.props;
    const {
      error,
    } = this.state;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography color='textSecondary'>
            {title && t(title)}
          </Typography>
          <div style={{ float: 'left', margin: '5px 0 0 5px' }}>
            <Tooltip title={t('Authorized Privileges')} >
              <Information fontSize="inherit" color="disabled" />
            </Tooltip>
          </div>
          <IconButton size='small' onClick={() => this.setState({ open: true })}>
            <AddIcon />
          </IconButton>
        </div>
        <div className={classes.scrollBg}>
          <div className={classes.scrollDiv}>
            <div className={classes.scrollObj}>
              {this.state.authorizedPrivileges.map((privilege, key) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '75% 1fr' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography>
                      {(privilege.name && t(privilege.name))}
                    </Typography>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <IconButton
                      size='small'
                      onClick={this.handleEdit.bind(this, key, privilege.id)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size='small'
                      // onClick={this.handleDelete.bind(this, key)}
                    >
                      <Delete />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Dialog
          open={this.state.open}
          onClose={() => this.setState({ open: false })}
          fullWidth={true}
          maxWidth='sm'
        >
          <Formik
            enableReinitialize={true}
            initialValues={{
              name: '',
              description: '',
              functions_performed: [],
            }}
            // validationSchema={AuthorizedPrivilegeCreationValidation(t)}
            onSubmit={this.onSubmit.bind(this)}
            onReset={this.handleClose.bind(this)}
          >
            {({
              handleReset,
              submitForm,
              isSubmitting,
              setFieldValue,
              values,
            }) => (
              <Form>
                <DialogTitle classes={{ root: classes.dialogTitle }}>{t('Create an authorized privilege')}</DialogTitle>
                <DialogContent classes={{ root: classes.dialogContent }}>
                  <Grid container={true} spacing={3}>
                    <Grid item={true} xs={12}>
                      <Typography
                        variant="h3"
                        color="textSecondary"
                        gutterBottom={true}
                        style={{ float: 'left' }}
                      >
                        {t('Name')}
                      </Typography>
                      <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                        <Tooltip title={t('Name')} >
                          <Information fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={TextField}
                        name="name"
                        fullWidth={true}
                        size="small"
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <Typography
                        variant="h3"
                        color="textSecondary"
                        gutterBottom={true}
                        style={{ float: 'left' }}
                      >
                        {t('Description')}
                      </Typography>
                      <div style={{ float: 'left', margin: '-1px 0 0 4px' }}>
                        <Tooltip title={t('Description')}>
                          <Information fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={MarkDownField}
                        name='description'
                        fullWidth={true}
                        multiline={true}
                        rows='3'
                        variant='outlined'
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <FunctionsPerformedField 
                        title='Functions Performed' 
                        name='functions_performed'
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions classes={{ root: classes.dialogClosebutton }}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    classes={{ root: classes.buttonPopover }}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={submitForm}
                    disabled={isSubmitting}
                    classes={{ root: classes.buttonPopover }}
                  >
                    {t('Submit')}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>
        <Dialog
          open={this.state.openEdit}
          onClose={() => this.setState({ openEdit: false })}
          fullWidth={true}
          maxWidth='sm'
        >
          <Formik
            enableReinitialize={true}
            initialValues={{
              id: this.state.id,
              name: this.state.name,
              description: this.state.description,
              functions_performed: this.state.functionsPerformed,
            }}
            // validationSchema={AuthorizedPrivilegeCreationValidation(t)}
            onSubmit={this.handleEditSubmit.bind(this)}
            onReset={this.handleEditClose.bind(this)}
          >
            {({
              handleReset,
              submitForm,
              isSubmitting,
              setFieldValue,
              values,
            }) => (
              <Form>
                <DialogTitle classes={{ root: classes.dialogTitle }}>{t('Edit an authorized privilege')}</DialogTitle>
                <DialogContent classes={{ root: classes.dialogContent }}>
                  <Grid container={true} spacing={3}>
                    <Grid item={true} xs={12}>
                      <Typography
                        variant="h3"
                        color="textSecondary"
                        gutterBottom={true}
                        style={{ float: 'left' }}
                      >
                        {t('Name')}
                      </Typography>
                      <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                        <Tooltip title={t('Name')} >
                          <Information fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={TextField}
                        name="name"
                        fullWidth={true}
                        size="small"
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <Typography
                        variant="h3"
                        color="textSecondary"
                        gutterBottom={true}
                        style={{ float: 'left' }}
                      >
                        {t('Description')}
                      </Typography>
                      <div style={{ float: 'left', margin: '-1px 0 0 4px' }}>
                        <Tooltip title={t('Description')}>
                          <Information fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={MarkDownField}
                        name='description'
                        fullWidth={true}
                        multiline={true}
                        rows='3'
                        variant='outlined'
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <FunctionsPerformedField 
                        title='Functions Performed' 
                        name='functions_performed'
                        setFieldValue={setFieldValue}
                        data={this.state.functionsPerformed}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions classes={{ root: classes.dialogClosebutton }}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    classes={{ root: classes.buttonPopover }}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={submitForm}
                    disabled={isSubmitting}
                    classes={{ root: classes.buttonPopover }}
                  >
                    {t('Submit')}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>
      </>
    );
  }
}

AuthorizedPrivilegesPopover.propTypes = {
  name: PropTypes.string,
  device: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  fldt: PropTypes.func,
};

export default compose(inject18n, withStyles(styles))(AuthorizedPrivilegesPopover);
