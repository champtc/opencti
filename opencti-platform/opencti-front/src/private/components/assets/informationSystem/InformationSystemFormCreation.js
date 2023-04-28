/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import * as Yup from 'yup';
import { compose } from 'ramda';
import { Formik, Form, Field } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import { Information } from 'mdi-material-ui';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import DialogContent from '@material-ui/core/DialogContent';
import Slide from '@material-ui/core/Slide';
import DialogActions from '@material-ui/core/DialogActions';
import graphql from 'babel-plugin-relay/macro';
import { parse } from '../../../../utils/Time';
import { commitMutation } from '../../../../relay/environment';
import inject18n from '../../../../components/i18n';
import TextField from '../../../../components/TextField';
import MarkDownField from '../../../../components/MarkDownField';
import { toastGenericError } from '../../../../utils/bakedToast';
import TaskType from '../../common/form/TaskType';
import SwitchField from '../../../../components/SwitchField';
import DatePickerField from '../../../../components/DatePickerField';

const styles = () => ({
  dialogMain: {
    overflow: 'hidden',
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
    overflow: 'scroll',
  },
  buttonPopover: {
    textTransform: 'capitalize',
  },
  textBase: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 5,
  },
});

const informationSystemFormCreationMutation = graphql`
  mutation InformationSystemFormCreationMutation($input: InformationSystemInput!) {
    createInformationSystem (input: $input) {
      id
    }
  }
`;

const InformationSystemValidation = (t) => Yup.object().shape({
  system_name: Yup.string().required(t('This field is required')),
  description: Yup.string().required(t('This field is required')),
  operational_status: Yup.string().required(t('This Field is required')).nullable(),
});

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';
class InformationSystemFormCreation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  onSubmit(values, { setSubmitting, resetForm }) {
    const adaptedValues = R.evolve(
      {
        date_authorized: () => (values.date_authorized === null
          ? null
          : parse(values.date_authorized).format('YYYY-MM-DD')),
      },
      values,
    );
    const finalValues = R.pipe(
      R.dissoc('created'),
      R.dissoc('modified'),
    )(adaptedValues);
    commitMutation({
      mutation: informationSystemFormCreationMutation,
      variables: {
        input: finalValues,
      },
      setSubmitting,
      pathname: '/defender_hq/assets/information_systems',
      onCompleted: () => {
        setSubmitting(false);
        resetForm();
        this.props.history.push('/defender_hq/assets/information_systems');
      },
      onError: () => {
        toastGenericError('Failed to create Information System');
      },
    });
  }

  onReset() {
    this.props.handleInformationSystemCreation('');
  }

  render() {
    const {
      t,
      classes,
      InfoSystemCreation,
    } = this.props;
    return (
      <>
        <Dialog
          open={InfoSystemCreation}
          keepMounted={false}
          className={classes.dialogMain}
        >
          <Formik
            enableReinitialize={true}
            initialValues={{
              short_name: '',
              system_name: '',
              description: '',
              deployment_model: null,
              date_authorized: null,
              operational_status: null,
              cloud_service_model: null,
              privacy_designation: false,
              identity_assurance_level: null,
              federation_assurance_level: null,
              authenticator_assurance_level: null,
            }}
            validationSchema={InformationSystemValidation(t)}
            onSubmit={this.onSubmit.bind(this)}
            onReset={this.onReset.bind(this)}
          >
            {({
              values,
              handleReset,
              submitForm,
              isSubmitting,
            }) => (
              <Form>
                <DialogTitle classes={{ root: classes.dialogTitle }}>{t('Information System')}</DialogTitle>
                <DialogContent classes={{ root: classes.dialogContent }}>
                  <Grid container={true} spacing={3}>
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Name')}
                        </Typography>
                        <Tooltip title={t('Name')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={TextField}
                        name="system_name"
                        fullWidth={true}
                        size="small"
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Short Name')}
                        </Typography>
                        <Tooltip title={t('Short Name')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={TextField}
                        name="short_name"
                        fullWidth={true}
                        size="small"
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Description')}
                        </Typography>
                        <Tooltip title={t('Description')}>
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
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
                    <Grid item={true} xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Deployment Model')}
                        </Typography>
                        <Tooltip title={t('Deployment Model')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="deployment_model"
                        taskType='DeploymentModelType'
                        fullWidth={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                        hasNull={true}
                      />
                    </Grid>
                    <Grid item={true} xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Cloud Service Modelssss')}
                        </Typography>
                        <Tooltip title={t('Cloud Service Model')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="cloud_service_model"
                        taskType='CloudServiceModelType'
                        fullWidth={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                        hasNull={true}
                        disabled={values.deployment_model && values.deployment_model.includes('cloud')}
                      />
                    </Grid>
                    <Grid item={true} xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Identity Assurance Level')}
                        </Typography>
                        <Tooltip title={t('Identity Assurance Level')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="identity_assurance_level"
                        taskType='IdentityAssuranceLevel'
                        fullWidth={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                        hasNull={true}
                      />
                    </Grid>
                    <Grid item={true} xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Authenticator Assurance Level')}
                        </Typography>
                        <Tooltip title={t('Authenticator Assurance Level')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="authenticator_assurance_level"
                        taskType='AuthenticatorAssuranceLevel'
                        fullWidth={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                        hasNull={true}
                      />
                    </Grid>
                    <Grid item={true} xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Federation Assurance Level')}
                        </Typography>
                        <Tooltip title={t('Federation Assurance Level')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="federation_assurance_level"
                        taskType='FederationAssuranceLevel'
                        fullWidth={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                        hasNull={true}
                      />
                    </Grid>
                    <Grid item={true} xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Status')}
                        </Typography>
                        <Tooltip title={t('Status')} >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <TaskType
                        name='operational_status'
                        taskType='OperationalStatus'
                        fullWidth={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                        required={true}
                      />
                    </Grid>
                    <Grid item={true} xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Date Authorized')}
                        </Typography>
                        <Tooltip title={t('Date Authorized')} >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <Field
                        fullWidth={true}
                        name='date_authorized'
                        component={DatePickerField}
                        invalidDateMessage={t(
                          'The value must be a date (YYYY-MM-DD)',
                        )}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Privacy Sensitive System')}
                        </Typography>
                        <Tooltip title={t('Privacy Sensitive System')} >
                          <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Typography>No</Typography>
                        <Field
                          component={SwitchField}
                          type="checkbox"
                          name="privacy_designation"
                          containerstyle={{ marginLeft: 10, marginRight: '-15px' }}
                          inputProps={{ 'aria-label': 'ant design' }}
                        />
                        <Typography>Yes</Typography>
                      </div>
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

InformationSystemFormCreation.propTypes = {
  InfoSystemCreation: PropTypes.bool,
  handleInformationSystemCreation: PropTypes.func,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(InformationSystemFormCreation);
