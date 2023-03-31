/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import * as Yup from 'yup';
import { compose } from 'ramda';
import { withRouter } from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles/index';
import { Formik, Form, Field } from 'formik';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Slide from '@material-ui/core/Slide';
import inject18n from '../../../../../components/i18n';
import { commitMutation } from '../../../../../relay/environment';
import { adaptFieldValue } from '../../../../../utils/String';
import TextField from '../../../../../components/TextField';
import { toastGenericError } from '../../../../../utils/bakedToast';
import MarkDownField from '../../../../../components/MarkDownField';
import TaskType from '../../../common/form/TaskType';
import RiskLevel from '../../../common/form/RiskLevel';
import SearchTextField from '../../../common/form/SearchTextField';
import SecurityCategorization from '../../../assets/informationSystem/SecurityCategorization';

const styles = (theme) => ({
  dialogMain: {
    overflowY: 'hidden',
  },
  dialogTitle: {
    padding: '24px 0 16px 24px',
  },
  dialogContent: {
    padding: '0 24px',
    marginBottom: '24px',
    overflowY: 'scroll',
    height: '650px',
  },
  dialogClosebutton: {
    float: 'left',
    marginLeft: '15px',
    marginBottom: '20px',
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '10px 0 20px 22px',
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

const informationTypeEntityEditionContainerMutation = graphql`
  mutation InformationTypeEntityEditionContainerMutation(
    $id: ID!,
    $input: [EditInput]!
  ) {
    editInformationType(id: $id, input: $input) {
      id
    }
  }
`;

const InformationTypeEntityEditionValidation = (t) => Yup.object().shape({
  title: Yup.string().required(t('This field is required')),
});

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class InformationTypeEntityEditionContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      selectedProduct: {},
    };
  }

  onSubmit(values, { setSubmitting, resetForm }) {
    const categorizations = [{
      catalog: values.catalog,
      system: values.system,
      information_type: values.information_type,
    }];
    const confidentialityImpact = {
      base_impact: values.confidentiality_impact_base,
      selected_impact: values.confidentiality_impact_selected,
      adjustment_justification: values.confidentiality_impact_justification || '',
    };
    const availabilityImpact = {
      base_impact: values.availability_impact_base,
      selected_impact: values.availability_impact_selected,
      adjustment_justification: values.availability_impact_justification || '',
    };
    const integrityImpact = {
      base_impact: values.integrity_impact_base,
      selected_impact: values.integrity_impact_selected,
      adjustment_justification: values.integrity_impact_justification || '',
    };
    const adaptedValues = R.pipe(
      R.dissoc('id'),
      R.dissoc('system'),
      R.dissoc('catalog'),
      R.dissoc('information_type'),
      R.dissoc('integrity_impact_base'),
      R.dissoc('categorization_system'),
      R.dissoc('availability_impact_base'),
      R.dissoc('integrity_impact_selected'),
      R.dissoc('confidentiality_impact_base'),
      R.dissoc('availability_impact_selected'),
      R.dissoc('integrity_impact_justification'),
      R.dissoc('confidentiality_impact_selected'),
      R.dissoc('availability_impact_justification'),
      R.dissoc('confidentiality_impact_justification'),
      R.assoc('categorizations', categorizations),
      R.assoc('integrity_impact', integrityImpact),
      R.assoc('availability_impact', availabilityImpact),
      R.assoc('confidentiality_impact', confidentialityImpact),
    )(values);
    const finalValues = R.pipe(
      R.toPairs,
      R.map((n) => ({
        'key': n[0],
        'value': n[1],           // adaptFieldValue(),
      })),
    )(adaptedValues);
    console.log(finalValues);
    commitMutation({
      mutation: informationTypeEntityEditionContainerMutation,
      variables: {
        id: this.props.informationType.id,
        input: finalValues,
      },
      setSubmitting,
      pathname: '/data/entities/information_types',
      onCompleted: (data) => {
        setSubmitting(false);
        resetForm();
      },
      onError: (err) => {
        console.error(err);
        toastGenericError('Failed to create Information Type');
      },
    });
  }

  onReset() {
    this.setState({ selectedProduct: {} });
    this.props.handleDisplayEdit();
  }

  handleSetFieldValues(selectedInfoType, setFieldValue, type) {
    console.log(selectedInfoType);
    const integrityImpact = R.pathOr({}, ['integrity_impact'], selectedInfoType);
    const availabilityImpact = R.pathOr({}, ['availability_impact'], selectedInfoType);
    const confidentialityImpact = R.pathOr({}, ['confidentiality_impact'], selectedInfoType);
    const categorization = R.pipe(
      R.pathOr([], ['categorizations']),
      R.mergeAll,
    )(selectedInfoType);
    if (type === 'select') {
      setFieldValue('system', selectedInfoType?.system);
      setFieldValue('information_type', selectedInfoType?.id);
    }
    if (type === 'search') {
      setFieldValue('catalog', categorization?.catalog?.id);
      setFieldValue('system', categorization?.catalog?.system);
      setFieldValue('information_type', categorization?.information_type?.id);
      setFieldValue('description', selectedInfoType?.description);
    }
    setFieldValue('confidentiality_impact_base', confidentialityImpact?.base_impact);
    setFieldValue('integrity_impact_base', integrityImpact?.base_impact);
    setFieldValue('availability_impact_base', availabilityImpact?.base_impact);
    setFieldValue('integrity_impact_selected', integrityImpact?.selected_impact);
    setFieldValue('availability_impact_selected', availabilityImpact?.selected_impact);
    setFieldValue('confidentiality_impact_selected', confidentialityImpact?.selected_impact);
    setFieldValue('integrity_impact_justification', integrityImpact?.adjustment_justification);
    setFieldValue('availability_impact_justification', availabilityImpact?.adjustment_justification);
    setFieldValue('confidentiality_impact_justification', confidentialityImpact?.adjustment_justification);
  }

  handleSearchTextField(selectedInfoType, setFieldValue) {
    this.setState({ selectedProduct: selectedInfoType }, () => this.handleSetFieldValues(selectedInfoType, setFieldValue, 'search'));
  }

  handleInformationType(infoType, setFieldValue) {
    this.setState({ selectedProduct: infoType }, () => this.handleSetFieldValues(infoType, setFieldValue, 'select'));
  }

  render() {
    const {
      classes,
      t,
      open,
      informationType,
    } = this.props;
    const {
      selectedProduct,
    } = this.state;
    const integrityImpact = R.pathOr({}, ['integrity_impact'], selectedProduct);
    const availabilityImpact = R.pathOr({}, ['availability_impact'], selectedProduct);
    const confidentialityImpact = R.pathOr({}, ['confidentiality_impact'], selectedProduct);
    const categorizations = R.pipe(
      R.pathOr([], ['categorizations']),
      R.mergeAll,
    )(informationType);
    const initialValues = R.pipe(
      R.assoc('id', informationType?.id || ''),
      R.assoc('title', informationType?.title || ''),
      R.assoc('system', categorizations?.catalog?.system || ''),
      R.assoc('categorization_system', categorizations?.information_type?.category || ''),
      R.assoc('catalog', categorizations?.catalog?.id || ''),
      R.assoc('description', informationType?.description || ''),
      R.assoc('information_type', categorizations?.information_type?.id || ''),
      R.assoc('integrity_impact_base', informationType.integrity_impact?.base_impact || ''),
      R.assoc('availability_impact_base', informationType?.availability_impact?.base_impact || ''),
      R.assoc('integrity_impact_selected', informationType?.integrity_impact?.selected_impact || ''),
      R.assoc('confidentiality_impact_base', informationType?.confidentiality_impact?.base_impact || ''),
      R.assoc('availability_impact_selected', informationType?.availability_impact?.selected_impact || ''),
      R.assoc('integrity_impact_justification', informationType?.integrity_impact?.adjustment_justification || ''),
      R.assoc('confidentiality_impact_selected', informationType?.confidentiality_impact?.selected_impact || ''),
      R.assoc('availability_impact_justification', informationType?.availability_impact?.adjustment_justification || ''),
      R.assoc('confidentiality_impact_justification', informationType?.confidentiality_impact?.adjustment_justification || ''),
      R.pick([
        'id',
        'title',
        'system',
        'catalog',
        'description',
        'information_type',
        'integrity_impact_base',
        'categorization_system',
        'availability_impact_base',
        'integrity_impact_selected',
        'confidentiality_impact_base',
        'availability_impact_selected',
        'integrity_impact_justification',
        'confidentiality_impact_selected',
        'availability_impact_justification',
        'confidentiality_impact_justification',
      ]),
    )(informationType);
    return (
        <Dialog
          open={open}
          maxWidth='md'
          keepMounted={false}
          className={classes.dialogMain}
        >
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={InformationTypeEntityEditionValidation(t)}
            onSubmit={this.onSubmit.bind(this)}
            onReset={this.onReset.bind(this)}
          >
            {({
              errors,
              values,
              submitForm,
              handleReset,
              isSubmitting,
              setFieldValue,
            }) => (
              <Form>
                <DialogTitle classes={{ root: classes.dialogTitle }}>
                  {t('Information Type')}
                </DialogTitle>
                <DialogContent classes={{ root: classes.dialogContent }}>
                  <Grid container={true} spacing={3}>
                    <Grid item={true} xs={12}>
                      <div style={{ marginBottom: '10px' }}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ float: 'left' }}
                        >
                          {t('Id')}
                        </Typography>
                        <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                          <Tooltip title={t('Id')} >
                            <Information fontSize="inherit" color="disabled" />
                          </Tooltip>
                        </div>
                        <div className="clearfix" />
                        <Field
                          component={TextField}
                          name="id"
                          fullWidth={true}
                          disabled={true}
                          size="small"
                          containerstyle={{ width: '100%' }}
                          variant='outlined'
                        />
                      </div>
                    </Grid>
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Name')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Identifies the identifier defined by the standard.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <SearchTextField
                        name='title'
                        data={informationType?.title}
                        errors={errors.title}
                        setFieldValue={setFieldValue}
                        handleSearchTextField={this.handleSearchTextField.bind(this)}
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Description')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Identifies a summary of the reponsible party purpose and associated responsibilities.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
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
                        containerstyle={{ width: '100px' }}
                      />
                    </Grid>
                    <SecurityCategorization
                      values={values}
                      setFieldValue={setFieldValue}
                      handleInformationType={this.handleInformationType.bind(this)}
                    />
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Confidentiality Impact')}
                        </Typography>
                        <Tooltip
                          title={confidentialityImpact.explanation || 'Confidentiality Impact'}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Base')}
                        </Typography>
                        <Tooltip
                          title={confidentialityImpact.recommendation || 'Base'}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      {informationType.confidentiality_impact
                        && <RiskLevel risk={informationType.confidentiality_impact.base_impact} />}
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Selected')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Override The provisional confidentiality impact level recommended for disclosure compensation management information is low.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <TaskType
                        name='confidentiality_impact_selected'
                        taskType='FIPS199'
                        fullWidth={true}
                        required={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid xs={8} item={true}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Justification')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Justification Identifies a summary of impact for how the risk affects the system.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <Field
                        component={MarkDownField}
                        name='confidentiality_impact_justification'
                        fullWidth={true}
                        multiline={true}
                        rows='1'
                        variant='outlined'
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Integrity Impact')}
                        </Typography>
                        <Tooltip
                          title={integrityImpact.explanation || 'Integrity Impact'}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Base')}
                        </Typography>
                        <Tooltip
                          title={integrityImpact.recommendation || 'Base'}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      {informationType.integrity_impact
                        && <RiskLevel risk={informationType.integrity_impact.base_impact} />}
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Selected')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Override The provisional Integrity Impact level recommended for disclosure compensation management information is low.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <TaskType
                        name='integrity_impact_selected'
                        taskType='FIPS199'
                        fullWidth={true}
                        required={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid xs={8} item={true}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Justification')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Justification Identifies a summary of impact for how the risk affects the system.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <Field
                        component={MarkDownField}
                        name='integrity_impact_justification'
                        fullWidth={true}
                        multiline={true}
                        rows='3'
                        variant='outlined'
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Availability Impact')}
                        </Typography>
                        <Tooltip
                          title={availabilityImpact.explanation || 'Availability Impact'}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Base')}
                        </Typography>
                        <Tooltip
                          title={availabilityImpact.recommendation || 'Base'}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      {informationType.availability_impact
                        && <RiskLevel risk={informationType.availability_impact.base_impact} />}
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Selected')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Override The provisional Availability Impact level recommended for disclosure compensation management information is low.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <TaskType
                        name='availability_impact_selected'
                        taskType='FIPS199'
                        fullWidth={true}
                        required={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant='outlined'
                      />
                    </Grid>
                    <Grid xs={8} item={true}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 , float: 'left' }}
                        >
                          {t('Justification')}
                        </Typography>
                        <Tooltip
                          title={t(
                            'Justification Identifies a summary of impact for how the risk affects the system.',
                          )}
                        >
                          <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
                        </Tooltip>
                      </div>
                      <div className='clearfix' />
                      <Field
                        component={MarkDownField}
                        name='availability_impact_justification'
                        fullWidth={true}
                        multiline={true}
                        rows='3'
                        variant='outlined'
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
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
    );
  }
}

InformationTypeEntityEditionContainer.propTypes = {
  handleDisplayEdit: PropTypes.func,
  refreshQuery: PropTypes.func,
  displayEdit: PropTypes.bool,
  history: PropTypes.object,
  disabled: PropTypes.bool,
  paginationOptions: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  connectionKey: PropTypes.string,
  enableReferences: PropTypes.bool,
  leveragedAuthorization: PropTypes.object,
};

export default compose(
  inject18n,
  withRouter,
  withStyles(styles),
)(InformationTypeEntityEditionContainer);
