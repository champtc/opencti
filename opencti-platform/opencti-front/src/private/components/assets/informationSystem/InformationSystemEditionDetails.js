/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import graphql from 'babel-plugin-relay/macro';
import { createFragmentContainer } from 'react-relay';
import { Field } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import * as Yup from 'yup';
import * as R from 'ramda';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import inject18n from '../../../../components/i18n';
import TextField from '../../../../components/TextField';
import { commitMutation } from '../../../../relay/environment';
import { parse } from '../../../../utils/Time';
import { adaptFieldValue } from '../../../../utils/String';
import TaskType from '../../common/form/TaskType';
import SwitchField from '../../../../components/SwitchField';
import DateTimePickerField from '../../../../components/DateTimePickerField';
import AddressField from '../../common/form/AddressField';
import HyperLinkField from '../../common/form/HyperLinkField';

const styles = () => ({
  paper: {
    height: '100%',
    minHeight: '100%',
    margin: '10px 0 0 0',
    padding: '24px 24px 32px 24px',
    borderRadius: 6,
  },
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
  importButton: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
});

const informationSystemMutationFieldPatch = graphql`
  mutation InformationSystemEditionDetailsFieldPatchMutation(
    $id: ID!
    $input: [EditInput]!
    $commitMessage: String
  ) {
    campaignEdit(id: $id) {
      fieldPatch(input: $input, commitMessage: $commitMessage) {
        id
        # ...Software_software
      }
    }
  }
`;

const informationSystemEditionDetailsFocus = graphql`
  mutation InformationSystemEditionDetailsFocusMutation($id: ID!, $input: EditContext!) {
    campaignEdit(id: $id) {
      contextPatch(input: $input) {
        id
      }
    }
  }
`;

const informationSystemValidation = (t) => Yup.object().shape({
  first_seen: Yup.date()
    .nullable()
    .typeError(t('The value must be a date (YYYY-MM-DD)')),
  last_seen: Yup.date()
    .nullable()
    .typeError(t('The value must be a date (YYYY-MM-DD)')),
  objective: Yup.string().nullable(),
});

class InformationSystemEditionDetailsComponent extends Component {
  handleChangeFocus(name) {
    commitMutation({
      mutation: informationSystemEditionDetailsFocus,
      variables: {
        id: this.props.informationSystem.id,
        input: {
          focusOn: name,
        },
      },
    });
  }

  onSubmit(values, { setSubmitting }) {
    const commitMessage = values.message;
    const inputValues = R.pipe(
      R.dissoc('message'),
      R.assoc(
        'first_seen',
        values.first_seen ? parse(values.first_seen).format() : null,
      ),
      R.assoc(
        'last_seen',
        values.last_seen ? parse(values.last_seen).format() : null,
      ),
      R.toPairs,
      R.map((n) => ({
        key: n[0],
        value: adaptFieldValue(n[1]),
      })),
    )(values);
    commitMutation({
      mutation: informationSystemMutationFieldPatch,
      variables: {
        id: this.props.informationSystem.id,
        input: inputValues,
        commitMessage:
          commitMessage && commitMessage.length > 0 ? commitMessage : null,
      },
      onCompleted: () => {
        setSubmitting(false);
        this.props.handleClose();
      },
    });
  }

  handleSubmitField(name, value) {
    if (!this.props.enableReferences) {
      informationSystemValidation(this.props.t)
        .validateAt(name, { [name]: value })
        .then(() => {
          commitMutation({
            mutation: informationSystemMutationFieldPatch,
            variables: {
              id: this.props.informationSystem.id,
              input: { key: name, value: value || '' },
            },
          });
        })
        .catch(() => false);
    }
  }

  render() {
    const {
      t,
      classes,
      informationSystem,
      context,
      enableReferences,
      setFieldValue,
      values,
      history
    } = this.props;
    // const initialValues = R.pipe(
    //   R.assoc('first_seen', dateFormat(informationSystem.first_seen)),
    //   R.assoc('last_seen', dateFormat(informationSystem.last_seen)),
    //   R.pick(['first_seen', 'last_seen', 'objective']),
    // )(informationSystem);
    const installedOn = R.map((n) => n.name)(values.installed_on) || [];
    const relatedRisk = R.map((n) => n.name)(values.related_risks) || [];
    return (
      <>
        {/* // <Formik
      //   enableReinitialize={true}
      //   initialValues={initialValues}
      //   validationSchema={informationSystemValidation(t)}
      //   onSubmit={this.onSubmit.bind(this)}
      // >
      //   {({ submitForm, isSubmitting, validateForm }) => (
      //     <Form style={{ margin: '20px 0 20px 0' }}> */}
        <div style={{ height: '100%' }}>
          <Typography variant="h4" gutterBottom={true}>
            {t('Details')}
          </Typography>
          <Paper classes={{ root: classes.paper }} elevation={2}>
            <Grid container={true} spacing={3}>
              <Grid container spacing={3}>
                <Grid item={true} xs={12}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Software Identifier')}
                  </Typography>
                  <div style={{ float: 'left', margin: '-5px 0 0 5px' }}>
                    <Tooltip title={t('Software Identifier')} >
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <Field
                    component={TextField}
                    variant='outlined'
                    name="software_identifier"
                    size='small'
                    fullWidth={true}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item={true} xs={6}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left', marginTop: 20 }}
                  >
                    {t('CPE Identifier')}
                  </Typography>
                  <div style={{ float: 'left', margin: '21px 0 0 5px' }}>
                    <Tooltip
                      title={t('CPE Identifier')}>
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <Field
                    component={TextField}
                    variant='outlined'
                    name="cpe_identifier"
                    size='small'
                    fullWidth={true}
                  />
                </Grid>
                <Grid item={true} xs={6}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left', marginTop: 20 }}
                  >
                    {t('Implementation Point')}
                  </Typography>
                  <div style={{ float: 'left', margin: '21px 0 0 5px' }}>
                    <Tooltip title={t('Implementation Point')} >
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <TaskType
                    name='implementation_point'
                    taskType='ImplementationPoint'
                    fullWidth={true}
                    variant='outlined'
                    style={{ height: '38.09px' }}
                    containerstyle={{ width: '100%' }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item={true} xs={6}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left', marginTop: 20 }}
                  >
                    {t('License Key')}
                  </Typography>
                  <div style={{ float: 'left', margin: '15px 0 0 5px' }}>
                    <Tooltip title={t('License Key')} >
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <Field
                    component={TextField}
                    style={{ height: '38.09px' }}
                    variant='outlined'
                    name="license_key"
                    size='small'
                    fullWidth={true}
                    containerstyle={{ width: '100%' }}
                  />
                </Grid>
                <Grid item={true} xs={6}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left', marginTop: 20 }}
                  >
                    {t('Installation ID')}
                  </Typography>
                  <div style={{ float: 'left', margin: '21px 0 0 5px' }}>
                    <Tooltip title={t('Installation ID')} >
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <Field
                    component={TextField}
                    variant='outlined'
                    name="installation_id"
                    size='small'
                    fullWidth={true}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item={true} xs={6}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left', marginTop: 20 }}
                  >
                    {t('Scanned')}
                  </Typography>
                  <div style={{ float: 'left', margin: '21px 0 0 5px' }}>
                    <Tooltip title={t('Scanned')} >
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <div className="clearfix" />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>No</Typography>
                    <Field
                      component={SwitchField}
                      type="checkbox"
                      name="is_scanned"
                      containerstyle={{ marginLeft: 10, marginRight: '-15px' }}
                      inputProps={{ 'aria-label': 'ant design' }}
                    />
                    <Typography>Yes</Typography>
                  </div>
                </Grid>
                <Grid item={true} xs={6}>
                  <Typography
                    variant="h3"
                    color="textSecondary"
                    gutterBottom={true}
                    style={{ float: 'left', marginTop: 20 }}
                  >
                    {t('Last Scaned')}
                  </Typography>
                  <div style={{ float: 'left', margin: '21px 0 0 5px' }}>
                    <Tooltip title={t('Last Scaned')}>
                      <Information fontSize="inherit" color="disabled" />
                    </Tooltip>
                  </div>
                  <Field
                    component={DateTimePickerField}
                    variant="outlined"
                    name="last_scanned"
                    size="small"
                    invalidDateMessage={t(
                      'The value must be a date (YYYY-MM-DD HH:MM)',
                    )}
                    fullWidth={true}
                    style={{ height: '38.09px' }}
                    containerstyle={{ width: '100%' }}
                  />
                </Grid>
              </Grid>
              <Grid item={true} xs={12}>
                <HyperLinkField
                  variant='outlined'
                  type='hardware'
                  multiple={true}
                  name="installed_on"
                  fullWidth={true}
                  style={{ height: '38.09px' }}
                  containerstyle={{ width: '90%' }}
                  helperText={'Indicates connected hardware on this entity.'}
                  data={informationSystem?.installed_on}
                  title={'Installed On Assets'}
                  setFieldValue={setFieldValue}
                  history={history}
                  link='/defender_hq/assets/devices'
                />
              </Grid>
              <Grid item={true} xs={12}>
                <HyperLinkField
                  variant='outlined'
                  type='risks'
                  multiple={true}
                  name="related_risks"
                  fullWidth={true}
                  style={{ height: '38.09px' }}
                  containerstyle={{ width: '90%' }}
                  helperText={'Indicates the risks related to this entity.'}
                  data={informationSystem?.related_risks}
                  title={'Related Risks'}
                  setFieldValue={setFieldValue}
                  history={history}
                  link='/activities/risk_assessment/risks'
                />
              </Grid>
            </Grid>
          </Paper>
        </div>
        {/* <Field
              component={DatePickerField}
              name="first_seen"
              label={t('First seen')}
              invalidDateMessage={t('The value must be a date (YYYY-MM-DD)')}
              fullWidth={true}
              onFocus={this.handleChangeFocus.bind(this)}
              onSubmit={this.handleSubmitField.bind(this)}
              helperText={
                <SubscriptionFocus context={context} fieldName="first_seen" />
              }
            />
            <Field
              component={DatePickerField}
              name="last_seen"
              label={t('Last seen')}
              invalidDateMessage={t('The value must be a date (YYYY-MM-DD)')}
              fullWidth={true}
              style={{ marginTop: 20 }}
              onFocus={this.handleChangeFocus.bind(this)}
              onSubmit={this.handleSubmitField.bind(this)}
              helperText={
                <SubscriptionFocus context={context} fieldName="last_seen" />
              }
            />
            <Field
              component={TextField}
              name="objective"
              label={t('Objective')}
              fullWidth={true}
              multiline={true}
              rows={4}
              style={{ marginTop: 20 }}
              onFocus={this.handleChangeFocus.bind(this)}
              onSubmit={this.handleSubmitField.bind(this)}
              helperText={
                <SubscriptionFocus context={context} fieldName="objective" />
              }
            />
            {enableReferences && (
              <CommitMessage
                submitForm={submitForm}
                disabled={isSubmitting}
                validateForm={validateForm}
              />
            )} */}
        {/* </Form>
        )}
      </Formik> */}
      </>
    );
  }
}

InformationSystemEditionDetailsComponent.propTypes = {
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
  informationSystem: PropTypes.object,
  context: PropTypes.array,
};

// const InformationSystemEditionDetails = createFragmentContainer(
//   InformationSystemEditionDetailsComponent,
//   {
//     informationSystem: graphql`
//       fragment SoftwareEditionDetails_software on Campaign {
//         id
//         first_seen
//         last_seen
//         objective
//       }
//     `,
//   },
// );

const InformationSystemEditionDetails = createFragmentContainer(
  InformationSystemEditionDetailsComponent,
  {
    informationSystem: graphql`
      fragment InformationSystemEditionDetails on SoftwareAsset {
        software_identifier
        license_key
        cpe_identifier
        patch_level
        installation_id
        implementation_point
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
  },
);

export default R.compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(InformationSystemEditionDetails);