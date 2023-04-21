/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { compose } from 'ramda';
import * as Yup from 'yup';
import { createFragmentContainer } from 'react-relay';
import { withStyles } from '@material-ui/core/styles';
import { Formik, Form, Field } from 'formik';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import graphql from 'babel-plugin-relay/macro';
import Button from '@material-ui/core/Button';
import {
  Grid,
  Slide,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from '@material-ui/core';
import inject18n from '../../../../components/i18n';
import MarkDownField from '../../../../components/MarkDownField';
import { toastGenericError } from '../../../../utils/bakedToast';
import { commitMutation } from '../../../../relay/environment';
import TaskType from '../../common/form/TaskType';
import TextField from '../../../../components/TextField';
import SecurityCategorization from './SecurityCategorization';
import RiskLevel from '../../common/form/RiskLevel';

const styles = (theme) => ({
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
    overflowY: 'scroll',
    height: '650px',
  },
  buttonPopover: {
    textTransform: 'capitalize',
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
  popoverDialog: {
    fontSize: '18px',
    lineHeight: '24px',
    color: theme.palette.header.text,
  },
  textBase: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 5,
  },
  impactContent: {
    display: 'flex',
    alignItems: 'center',
  },
  impactText: {
    marginLeft: '10px',
  },
  textField: {
    height: '38.09px',
  },
});

const informationTypeEditionMutation = graphql`
  mutation InformationTypeEditionMutation(
    $id: ID!
    $input: [EditInput]!
  ) {
    editInformationType(id: $id, input: $input) {
      id
    }
  }
`;

const InformationTypeValidation = (t) => Yup.object().shape({
  title: Yup.string().required(t('This field is required')),
  system: Yup.string().required(t('This field is required')),
  catalog: Yup.string().required(t('This field is required')),
  description: Yup.string().required(t('This field is required')),
  information_type: Yup.string().required(t('This field is required')),
});
const Transition = React.forwardRef((props, ref) => (
  <Slide direction='up' ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class InformationTypeEditionComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      selectedProduct: {},
    };
  }

  onSubmit(values, { setSubmitting, resetForm }) {
    const categorizations = {
      catalog: values.catalog,
      system: values.system,
      information_type: values.information_type,
    };
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
    const finalValues = R.pipe(
      R.dissoc('system'),
      R.dissoc('catalog'),
      R.dissoc('category'),
      R.dissoc('information_type'),
      R.dissoc('integrity_impact_base'),
      R.dissoc('availability_impact_base'),
      R.dissoc('integrity_impact_selected'),
      R.dissoc('confidentiality_impact_base'),
      R.dissoc('availability_impact_selected'),
      R.dissoc('integrity_impact_justification'),
      R.dissoc('confidentiality_impact_selected'),
      R.dissoc('availability_impact_justification'),
      R.dissoc('confidentiality_impact_justification'),
      R.assoc('categorizations', categorizations),
      R.assoc('integrity_impact', JSON.stringify(integrityImpact)),
      R.assoc('availability_impact', JSON.stringify(availabilityImpact)),
      R.assoc('confidentiality_impact', JSON.stringify(confidentialityImpact)),
      R.dissoc('categorizations'),
      R.toPairs,
      R.map((n) => {
        return {
          key: n[0],
          value: n[1],
        }
      }),
    )(values);
    commitMutation({
      mutation: informationTypeEditionMutation,
      variables: {
        id: this.props.data.informationType.id,
        input: finalValues,
      },
      setSubmitting,
      pathname: '/defender_hq/assets/information_systems',
      onCompleted: (data) => {
        setSubmitting(false);
        resetForm();
      },
      onError: (err) => {
        console.error(err);
        toastGenericError('Failed to edit Information Type');
      },
    });
  }

  onReset() {
    this.setState({ selectedProduct: {} });
    this.props.handleEditInfoType();
  }

  handleSetFieldValues(selectedInfoType, setFieldValue, type) {
    const integrityImpact = R.pathOr(
      {},
      ['integrity_impact'],
      selectedInfoType,
    );
    const availabilityImpact = R.pathOr(
      {},
      ['availability_impact'],
      selectedInfoType,
    );
    const confidentialityImpact = R.pathOr(
      {},
      ['confidentiality_impact'],
      selectedInfoType,
    );
    const categorization = R.pipe(
      R.pathOr([], ['categorizations']),
      R.mergeAll,
    )(selectedInfoType);
    if (type === 'select') {
      setFieldValue('system', selectedInfoType?.system);
      setFieldValue('category', selectedInfoType?.category);
      setFieldValue('information_type', selectedInfoType?.id);
    }
    if (type === 'search') {
      setFieldValue('catalog', categorization?.catalog?.id);
      setFieldValue('category', categorization?.information_type?.category);
      setFieldValue('system', categorization?.system);
      setFieldValue('information_type', categorization?.information_type?.id);
      setFieldValue('description', selectedInfoType?.description);
    }
    setFieldValue(
      'confidentiality_impact_base',
      confidentialityImpact?.base_impact,
    );
    setFieldValue('integrity_impact_base', integrityImpact?.base_impact);
    setFieldValue('availability_impact_base', availabilityImpact?.base_impact);
    setFieldValue(
      'integrity_impact_selected',
      integrityImpact?.selected_impact,
    );
    setFieldValue(
      'availability_impact_selected',
      availabilityImpact?.selected_impact,
    );
    setFieldValue(
      'confidentiality_impact_selected',
      confidentialityImpact?.selected_impact,
    );
    setFieldValue(
      'integrity_impact_justification',
      integrityImpact?.adjustment_justification,
    );
    setFieldValue(
      'availability_impact_justification',
      availabilityImpact?.adjustment_justification,
    );
    setFieldValue(
      'confidentiality_impact_justification',
      confidentialityImpact?.adjustment_justification,
    );
  }

  handleSearchTextField(selectedInfoType, setFieldValue) {
    this.setState({ selectedProduct: selectedInfoType }, () => this.handleSetFieldValues(selectedInfoType, setFieldValue, 'search'));
  }

  renderRiskLevel(baseTitle) {
    const { t, classes } = this.props;
    return (
      <div className={classes.impactContent}>
        <RiskLevel risk={baseTitle} />
        <span className={classes.impactText}>
          {baseTitle.includes('low') && t('Low')}
          {baseTitle.includes('moderate') && t('Moderate')}
          {baseTitle.includes('high') && t('High')}
        </span>
      </div>
    )
  }

  handleInformationType(infoType, setFieldValue) {
    this.setState({ selectedProduct: infoType }, () => this.handleSetFieldValues(infoType, setFieldValue, 'select'));
  }

  render() {
    const {
      t,
      classes,
      openEdit,
      data,
    } = this.props;
    const {
      selectedProduct,
    } = this.state;
    const informationType = data.informationType;
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
      R.assoc('system', categorizations?.system || ''),
      R.assoc('catalog', categorizations?.catalog?.id || ''),
      R.assoc('category', categorizations?.information_type?.category || ''),
      R.assoc('description', informationType?.description || ''),
      R.assoc('information_type', categorizations?.information_type?.id || ''),
      R.assoc('integrity_impact_base', informationType?.integrity_impact?.base_impact || ''),
      R.assoc('availability_impact_base', informationType?.availability_impact?.base_impact || ''),
      R.assoc('integrity_impact_selected', informationType?.integrity_impact?.selected_impact || ''),
      R.assoc('confidentiality_impact_base', informationType?.confidentiality_impact?.base_impact || ''),
      R.assoc('availability_impact_selected', informationType?.availability_impact?.selected_impact || ''),
      R.assoc('integrity_impact_justification', informationType?.integrity_impact?.adjustment_justification || ''),
      R.assoc('confidentiality_impact_selected', informationType?.confidentiality_impact?.selected_impact || ''),
      R.assoc('availability_impact_justification', informationType?.availability_impact?.adjustment_justification || ''),
      R.assoc('confidentiality_impact_justification', informationType?.confidentiality_impact?.adjustment_justification || ''),
      R.pick([
        'title',
        'system',
        'catalog',
        'category',
        'description',
        'information_type',
        'integrity_impact_base',
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
      <>
        <Dialog
          open={openEdit}
          maxWidth='md'
          keepMounted={false}
          className={classes.dialogMain}
        >
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={InformationTypeValidation(t)}
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
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 }}
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
                      <Field
                        component={TextField}
                        name='title'
                        fullWidth={true}
                        variant='outlined'
                        size='small'
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid xs={12} item={true}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 }}
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
                      disabled={true}
                      setFieldValue={setFieldValue}
                      handleInformationType={this.handleInformationType.bind(this)}
                    />
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
                      {(selectedProduct.confidentiality_impact
                        && this.renderRiskLevel(selectedProduct.confidentiality_impact.base_impact))
                        || (informationType.confidentiality_impact
                          && this.renderRiskLevel(informationType.confidentiality_impact.base_impact))}
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
                      {(selectedProduct.integrity_impact
                        && this.renderRiskLevel(selectedProduct.integrity_impact.base_impact))
                        || (informationType.integrity_impact
                          && this.renderRiskLevel(informationType.integrity_impact.base_impact))}
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
                      {(selectedProduct.availability_impact
                        && this.renderRiskLevel(selectedProduct.availability_impact.base_impact))
                        || (informationType.availability_impact
                          && this.renderRiskLevel(informationType.availability_impact.base_impact))}
                    </Grid>
                    <Grid item={true} xs={2}>
                      <div className={classes.textBase}>
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ margin: 0 }}
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
                          style={{ margin: 0 }}
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
      </>
    );
  }
}

InformationTypeEditionComponent.propTypes = {
  t: PropTypes.func,
  name: PropTypes.string,
  openEdit: PropTypes.bool,
  classes: PropTypes.object,
  handleEditInfoType: PropTypes.func,
  renderSecurityImpact: PropTypes.func,
  data: PropTypes.object,
};

export const InformationTypeEditionQuery = graphql`
  query InformationTypeEditionQuery($id: ID!) {
    ...InformationTypeEdition_information
      @arguments(id: $id)
  }
`;

const InformationTypeEdition = createFragmentContainer(
  InformationTypeEditionComponent,
  {
    data: graphql`
      fragment InformationTypeEdition_information on Query
      @argumentDefinitions(
        id: { type: "ID!" }
      ) {
        informationType(id: $id) {
          id
          entity_type
          title
          description
          categorizations {
            id
            entity_type
            system
            catalog {
              id
            }
            information_type {
              id
              entity_type
              identifier
              category
            }
          }
          confidentiality_impact {
            id
            base_impact
            selected_impact
            adjustment_justification
          }
          integrity_impact {
            id
            base_impact
            selected_impact
            adjustment_justification
          }
          availability_impact {
            id
            base_impact
            selected_impact
            adjustment_justification
          }
        }
      }
    `,
  },
);

export default compose(inject18n, withStyles(styles))(InformationTypeEdition);
