import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as Yup from 'yup';
import * as R from 'ramda';
import { Formik, Form, Field } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import { Information } from 'mdi-material-ui';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import { MenuItem } from '@material-ui/core';
import DialogContent from '@material-ui/core/DialogContent';
import Slide from '@material-ui/core/Slide';
import DialogActions from '@material-ui/core/DialogActions';
import graphql from 'babel-plugin-relay/macro';
import { commitMutation } from '../../../../../relay/environment';
import inject18n from '../../../../../components/i18n';
import TextField from '../../../../../components/TextField';
import DatePickerField from '../../../../../components/DatePickerField';
import MarkDownField from '../../../../../components/MarkDownField';
import { toastGenericError } from '../../../../../utils/bakedToast';
import TaskType from '../../../common/form/TaskType';
import ColorPickerField from '../../../../../components/ColorPickerField';
import SelectField from '../../../../../components/SelectField';

const styles = (theme) => ({
  dialogMain: {
    overflowY: 'hidden',
  },
  dialogClosebutton: {
    float: 'left',
    marginLeft: '15px',
    marginBottom: '20px',
  },
  dialogTitle: {
    padding: '24px 0 16px 24px',
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '10px 0 20px 22px',
  },
  dialogContent: {
    padding: '0 24px',
    marginBottom: '24px',
    overflowY: 'scroll',
    height: '650px',
  },
  buttonPopover: {
    textTransform: 'capitalize',
  },
  popoverDialog: {
    fontSize: '18px',
    lineHeight: '24px',
    color: theme.palette.header.text,
  },
});

const entitiesDataMarkingsCreationStatementMutation = graphql`
  mutation EntitiesDataMarkingsCreationStatementMutation(
    $input: StatementMarkingInput
  ) {
    createStatementMarking(input: $input) {
      id
      entity_type
      created
      modified
      definition_type
      color
      name
      description
      statement
    }
  }
`;

const entitiesDataMarkingsCreationIEPMutation = graphql`
  mutation EntitiesDataMarkingsCreationIEPMutation($input: IEPMarkingInput) {
    createIEPMarking(input: $input) {
      id
      entity_type
      created
      modified
      definition_type
      color
      name
      description
      start_date
      end_date
      encrypt_in_transit
      permitted_actions
      tlp
      attribution
      unmodified_resale
      affected_party_notifications
      iep_version
    }
  }
`;

const DataMarkingCreationValidation = (t, type) => {
  let schema = Yup.object().shape({
    name: Yup.string().required(t('This field is required')),
    color: Yup.string().required(t('This field is required')),
    definition_type: Yup.string().required(t('This field is required')),
  });

  if (type === 'statement') {
    schema = schema.shape({
      statement: Yup.string().nullable().required(t('This field is required')),
    });
  } else if (type === 'iep') {
    schema = schema.shape({
      affected_party_notifications: Yup.string()
        .nullable()
        .required(t('This field is required')),
      attribution: Yup.string()
        .nullable()
        .required(t('This field is required')),
      encrypt_in_transit: Yup.string()
        .nullable()
        .required(t('This field is required')),
      permitted_actions: Yup.string()
        .nullable()
        .required(t('This field is required')),
      tlp: Yup.string().nullable().required(t('This field is required')),
      unmodified_resale: Yup.string()
        .nullable()
        .required(t('This field is required')),
    });
  }

  return schema;
};

const Transition = React.forwardRef((props, ref) => (
  <Slide direction='up' ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';
class EntitiesDataMarkingsCreation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      onSubmit: false,
      disableSubmit: false,
      displayCancel: false,
    };
  }

  handleCancelButton() {
    this.setState({ displayCancel: false });
  }

  handleOpenCancelButton() {
    this.setState({ displayCancel: true });
  }

  handleOpen() {
    this.setState({ open: true });
  }

  onSubmit(values, { setSubmitting, resetForm, setErrors }) {
    this.setState({ disableSubmit: true });
    const finalValuesForIEP = R.pipe(
      R.dissoc('created'),
      R.dissoc('modified'),
      R.dissoc('definition_type'),
      R.dissoc('statement'),
    )(values);
    const finalValuesForStatement = R.pipe(
      R.dissoc('created'),
      R.dissoc('modified'),
      R.dissoc('definition_type'),
      R.dissoc('start_date'),
      R.dissoc('end_date'),
      R.dissoc('encrypt_in_transit'),
      R.dissoc('permitted_actions'),
      R.dissoc('affected_party_notifications'),
      R.dissoc('tlp'),
      R.dissoc('iep_version'),
      R.dissoc('unmodified_resale'),
      R.dissoc('attribution'),
    )(values);

    const finalValues = values.definition_type === 'statement'
      ? finalValuesForStatement
      : finalValuesForIEP;

    DataMarkingCreationValidation(this.props.t, values.definition_type)
      .validate(values, { abortEarly: false })
      .then(() => {
        commitMutation({
          mutation:
            values.definition_type === 'statement'
              ? entitiesDataMarkingsCreationStatementMutation
              : entitiesDataMarkingsCreationIEPMutation,
          variables: {
            input: finalValues,
          },
          setSubmitting,
          pathname: '/data/entities/data_markings',
          onCompleted: () => {
            setSubmitting(false);
            this.setState({ disableSubmit: false });
            resetForm();
            this.props.handleDataMarkingCreation();
            this.props.history.push('/data/entities/data_markings');
          },
          onError: () => {
            toastGenericError('Failed to create data markings');
            this.setState({ disableSubmit: false });
          },
        });
      })
      .catch((errors) => {
        setSubmitting(false);
        const error = {};
        if (errors.inner) {
          errors.inner.forEach((err) => {
            error[err.path] = err.message || err.type;
          });
        }
        setErrors(error);
        this.setState({ disableSubmit: false });
      });
  }

  handleClose() {
    this.setState({ open: false });
  }

  handleSubmit() {
    this.setState({ onSubmit: true });
  }

  onReset() {
    this.props.handleDataMarkingCreation();
  }

  render() {
    const { t, classes, openDataCreation } = this.props;
    return (
      <>
        <Dialog
          open={openDataCreation}
          keepMounted={true}
          className={classes.dialogMain}
        >
          <Formik
            enableReinitialize={true}
            initialValues={{
              tlp: '',
              name: '',
              color: '',
              end_date: null,
              start_date: null,
              created: null,
              modified: null,
              statement: '',
              description: '',
              attribution: '',
              definition_type: '',
              permitted_actions: '',
              unmodified_resale: '',
              encrypt_in_transit: '',
              affected_party_notifications: '',
            }}
            onSubmit={this.onSubmit.bind(this)}
            onReset={this.onReset.bind(this)}
          >
            {({
              handleReset, submitForm, values,
            }) => (
              <Form>
                <DialogTitle classes={{ root: classes.dialogTitle }}>
                  {t('Markings')}
                </DialogTitle>
                <DialogContent classes={{ root: classes.dialogContent }}>
                  <Grid container={true} spacing={3}>
                    <Grid item={true} xs={12}>
                      <div style={{ marginBottom: '10px' }}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ float: 'left' }}
                        >
                          {t('Id')}
                        </Typography>
                        <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                          <Tooltip title={t('Id')}>
                            <Information fontSize='inherit' color='disabled' />
                          </Tooltip>
                        </div>
                        <div className='clearfix' />
                        <Field
                          component={TextField}
                          name='id'
                          fullWidth={true}
                          disabled={true}
                          size='small'
                          containerstyle={{ width: '100%' }}
                          variant='outlined'
                        />
                      </div>
                    </Grid>
                  </Grid>
                  <Grid container={true} spacing={3}>
                    <Grid item={true} xs={6}>
                      <div style={{ marginBottom: '12px' }}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ float: 'left' }}
                        >
                          {t('Created Date')}
                        </Typography>
                        <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                          <Tooltip title={t('Created')}>
                            <Information fontSize='inherit' color='disabled' />
                          </Tooltip>
                        </div>
                        <div className='clearfix' />
                        <Field
                          component={DatePickerField}
                          name='created'
                          fullWidth={true}
                          disabled={true}
                          size='small'
                          containerstyle={{ width: '100%' }}
                          variant='outlined'
                          invalidDateMessage={t(
                            'The value must be a date (YYYY-MM-DD)',
                          )}
                          style={{ height: '38.09px' }}
                        />
                      </div>
                    </Grid>
                    <Grid item={true} xs={6}>
                      <div>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ float: 'left' }}
                        >
                          {t('Modified Date')}
                        </Typography>
                        <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                          <Tooltip title={t('Last Modified')}>
                            <Information fontSize='inherit' color='disabled' />
                          </Tooltip>
                        </div>
                        <div className='clearfix' />
                        <Field
                          component={DatePickerField}
                          name='modified'
                          fullWidth={true}
                          disabled={true}
                          size='small'
                          variant='outlined'
                          invalidDateMessage={t(
                            'The value must be a date (YYYY-MM-DD)',
                          )}
                          style={{ height: '38.09px' }}
                          containerstyle={{ width: '100%' }}
                        />
                      </div>
                    </Grid>
                    <Grid item={true} xs={12}>
                      <Typography
                        variant='h3'
                        color='textSecondary'
                        gutterBottom={true}
                        style={{ float: 'left' }}
                      >
                        {t('Marking Type')}
                      </Typography>
                      <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                        <Tooltip title={t('Marking Type')}>
                          <Information fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <TaskType
                        name='definition_type'
                        taskType='DataMarkingType'
                        fullWidth={true}
                        required={true}
                        style={{ height: '18.09px' }}
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item={true} xs={12}>
                      <Typography
                        variant='h3'
                        color='textSecondary'
                        gutterBottom={true}
                        style={{ float: 'left' }}
                      >
                        {t('Name')}
                      </Typography>
                      <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                        <Tooltip title={t('Name')}>
                          <Information fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <Field
                        component={TextField}
                        name='name'
                        fullWidth={true}
                        size='small'
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <Typography
                        variant='h3'
                        color='textSecondary'
                        gutterBottom={true}
                        style={{ float: 'left' }}
                      >
                        {t('Description')}
                      </Typography>
                      <div style={{ float: 'left', margin: '-1px 0 0 4px' }}>
                        <Tooltip title={t('Description')}>
                          <Information fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
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
                    <Grid item={true} xs={12}>
                      <div style={{ marginTop: '10px' }}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ float: 'left' }}
                        >
                          {t('Color')}
                        </Typography>
                        <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                          <Tooltip title={t('Marking')}>
                            <Information fontSize='inherit' color='disabled' />
                          </Tooltip>
                        </div>
                        <div className='clearfix' />
                        <Field
                          component={ColorPickerField}
                          name='color'
                          fullWidth={true}
                        />
                      </div>
                    </Grid>
                    {values.definition_type === 'statement' && (
                      <Grid item={true} xs={12}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ float: 'left' }}
                        >
                          {t('Statement Text')}
                        </Typography>
                        <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                          <Tooltip title={t('Name')}>
                            <Information fontSize='inherit' color='disabled' />
                          </Tooltip>
                        </div>
                        <div className='clearfix' />
                        <Field
                          component={TextField}
                          name='statement'
                          fullWidth={true}
                          size='small'
                          containerstyle={{ width: '100%' }}
                          variant='outlined'
                        />
                      </Grid>
                    )}

                    {values.definition_type === 'iep' && (
                      <>
                        <Grid item={true} xs={6}>
                          <Typography
                            variant='h3'
                            color='textSecondary'
                            gutterBottom={true}
                            style={{ float: 'left' }}
                          >
                            {t('IEP Version')}
                          </Typography>
                          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                            <Tooltip title={t('IEP Version')}>
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
                            </Tooltip>
                          </div>
                          <div className='clearfix' />
                          <Field
                            component={SelectField}
                            name="iep_version"
                            // label={t('Opinion')}
                            fullWidth={true}
                            style={{ height: '13.09px' }}
                            containerstyle={{ width: '100%' }}
                          >
                            <MenuItem value="2.0">
                              {t('2.0')}
                            </MenuItem>
                          </Field>
                        </Grid>
                        <Grid item={true} xs={6}>
                            <Typography
                              variant='h3'
                              color='textSecondary'
                              gutterBottom={true}
                              style={{ float: 'left' }}
                            >
                              {t('Start Date')}
                            </Typography>
                            <div
                              style={{ float: 'left', margin: '1px 0 0 5px' }}
                            >
                              <Tooltip title={t('Start')}>
                                <Information
                                  fontSize='inherit'
                                  color='disabled'
                                />
                              </Tooltip>
                            </div>
                            <div className='clearfix' />
                            <Field
                              component={DatePickerField}
                              name='start_date'
                              fullWidth={true}
                              size='small'
                              style={{ height: '18.09px' }}
                              containerstyle={{ width: '100%' }}
                              variant='outlined'
                              invalidDateMessage={t(
                                'The value must be a date (YYYY-MM-DD)',
                              )}
                            />
                        </Grid>
                        <Grid item={true} xs={6}>
                            <Typography
                              variant='h3'
                              color='textSecondary'
                              gutterBottom={true}
                              style={{ float: 'left' }}
                            >
                              {t('End Date')}
                            </Typography>
                            <div
                              style={{ float: 'left', margin: '1px 0 0 5px' }}
                            >
                              <Tooltip title={t('End')}>
                                <Information
                                  fontSize='inherit'
                                  color='disabled'
                                />
                              </Tooltip>
                            </div>
                            <div className='clearfix' />
                            <Field
                              component={DatePickerField}
                              name='end_date'
                              fullWidth={true}
                              size='small'
                              style={{ height: '18.09px' }}
                              containerstyle={{ width: '100%' }}
                              variant='outlined'
                              invalidDateMessage={t(
                                'The value must be a date (YYYY-MM-DD)',
                              )}
                            />
                        </Grid>
                        <Grid item={true} xs={6}>
                          <Typography
                            variant='h3'
                            color='textSecondary'
                            gutterBottom={true}
                            style={{ float: 'left' }}
                          >
                            {t('Encrypt In Transit')}
                          </Typography>
                          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                            <Tooltip title={t('Encrypt In Transit')}>
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
                            </Tooltip>
                          </div>
                          <div className='clearfix' />
                          <TaskType
                            name='encrypt_in_transit'
                            taskType='EncryptInTransit'
                            fullWidth={true}
                            required={true}
                            style={{ height: '13.09px' }}
                            containerstyle={{ width: '100%' }}
                          />
                        </Grid>
                        <Grid item={true} xs={6}>
                          <Typography
                            variant='h3'
                            color='textSecondary'
                            gutterBottom={true}
                            style={{ float: 'left' }}
                          >
                            {t('Affected Party Notifications')}
                          </Typography>
                          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                            <Tooltip title={t('Affected Party Notifications')}>
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
                            </Tooltip>
                          </div>
                          <div className='clearfix' />
                          <TaskType
                            name='affected_party_notifications'
                            taskType='AffectedPartyNotifications'
                            fullWidth={true}
                            required={true}
                            style={{ height: '18.09px' }}
                            containerstyle={{ width: '100%' }}
                          />
                        </Grid>
                        <Grid item={true} xs={12}>
                          <Typography
                            variant='h3'
                            color='textSecondary'
                            gutterBottom={true}
                            style={{ float: 'left' }}
                          >
                            {t('Permitted Actions')}
                          </Typography>
                          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                            <Tooltip title={t('Permitted Actions')}>
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
                            </Tooltip>
                          </div>
                          <div className='clearfix' />
                          <TaskType
                            name='permitted_actions'
                            taskType='PermittedActions'
                            fullWidth={true}
                            required={true}
                            style={{ height: '18.09px' }}
                            containerstyle={{ width: '100%' }}
                          />
                        </Grid>
                        <Grid item={true} xs={6}>
                          <Typography
                            variant='h3'
                            color='textSecondary'
                            gutterBottom={true}
                            style={{ float: 'left' }}
                          >
                            {t('Sharing')}
                          </Typography>
                          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                            <Tooltip title={t('Sharing')}>
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
                            </Tooltip>
                          </div>
                          <div className='clearfix' />
                          <TaskType
                            name='tlp'
                            taskType='TLPLevel'
                            fullWidth={true}
                            required={true}
                            style={{ height: '18.09px' }}
                            containerstyle={{ width: '100%' }}
                          />
                        </Grid>
                        <Grid item={true} xs={6}>
                          <Typography
                            variant='h3'
                            color='textSecondary'
                            gutterBottom={true}
                            style={{ float: 'left' }}
                          >
                            {t('Provider Attribution')}
                          </Typography>
                          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                            <Tooltip title={t('Provider Attribution')}>
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
                            </Tooltip>
                          </div>
                          <div className='clearfix' />
                          <TaskType
                            name='attribution'
                            taskType='ProviderAttribution'
                            fullWidth={true}
                            required={true}
                            style={{ height: '18.09px' }}
                            containerstyle={{ width: '100%' }}
                          />
                        </Grid>
                        <Grid item={true} xs={6}>
                          <Typography
                            variant='h3'
                            color='textSecondary'
                            gutterBottom={true}
                            style={{ float: 'left' }}
                          >
                            {t('Unmodified Resale')}
                          </Typography>
                          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                            <Tooltip title={t('Unmodified Resale')}>
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
                            </Tooltip>
                          </div>
                          <div className='clearfix' />
                          <TaskType
                            name='unmodified_resale'
                            taskType='UnmodifiedResale'
                            fullWidth={true}
                            required={true}
                            style={{ height: '18.09px' }}
                            containerstyle={{ width: '100%' }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </DialogContent>
                <DialogActions classes={{ root: classes.dialogClosebutton }}>
                  <Button
                    variant='outlined'
                    onClick={handleReset}
                    classes={{ root: classes.buttonPopover }}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={submitForm}
                    disabled={this.state.disableSubmit}
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

EntitiesDataMarkingsCreation.propTypes = {
  openDataCreation: PropTypes.bool,
  handleDataMarkingCreation: PropTypes.func,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

export default R.compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(EntitiesDataMarkingsCreation);
