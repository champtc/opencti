/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import graphql from 'babel-plugin-relay/macro';
import IconButton from '@material-ui/core/IconButton';
import inject18n from '../../../../components/i18n';
import { toastGenericError } from '../../../../utils/bakedToast';
import { QueryRenderer, commitMutation } from '../../../../relay/environment';
import InformationTypeEdition, {
  InformationTypeEditionQuery,
} from './InformationTypeEdition';
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
    display: 'grid',
    gridTemplateColumns: '40% 1fr 1fr 1fr',
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
});

const informationTypesCreationMutation = graphql`
  mutation InformationTypesCreationMutation($input: InformationTypeInput!) {
    createInformationType(input: $input) {
      id
    }
  }
`;

const informationTypesDeleteMutation = graphql`
  mutation InformationTypesCreationDeleteMutation($id: ID!) {
    deleteInformationType(id: $id)
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
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class InformationTypesCreationComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      openEdit: false,
      selectedProduct: {},
      informationTypeId: '',
    };
  }

  onSubmit(values, { setSubmitting, resetForm }) {
    console.log(values);
    const categorizations = [
      {
        catalog: values.catalog,
        system: values.system,
        information_type: values.information_type,
      },
    ];
    const confidentialityImpact = {
      base_impact: values.confidentiality_impact_base,
      selected_impact: values.confidentiality_impact_selected,
      adjustment_justification:
        values.confidentiality_impact_justification || '',
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
      R.dissoc('information_type'),
      R.dissoc('categorization_system'),
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
      R.assoc('integrity_impact', integrityImpact),
      R.assoc('availability_impact', availabilityImpact),
      R.assoc('confidentiality_impact', confidentialityImpact),
    )(values);
    commitMutation({
      mutation: informationTypesCreationMutation,
      variables: {
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
        toastGenericError('Failed to create Information Type');
      },
    });
  }

  onReset() {
    this.setState({ open: false, selectedProduct: {} });
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
      setFieldValue('information_type', selectedInfoType?.id);
    }
    if (type === 'search') {
      setFieldValue('catalog', categorization?.id);
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

  handleInformationType(infoType, setFieldValue) {
    this.setState({ selectedProduct: infoType }, () => this.handleSetFieldValues(infoType, setFieldValue, 'select'));
  }

  handleEditInfoType(informationTypeId) {
    if (informationTypeId) {
      this.setState({ informationTypeId });
    }
    this.setState({ openEdit: !this.state.openEdit });
  }

  handleDeleteInfoType(infoTypeId) {
    commitMutation({
      mutation: informationTypesDeleteMutation,
      variables: {
        id: infoTypeId,
      },
      setSubmitting,
      pathname: '/defender_hq/assets/information_systems',
      onCompleted: (data) => {
        setSubmitting(false);
        resetForm();
      },
      onError: (err) => {
        console.error(err);
        toastGenericError('Failed to delete Information Type');
      },
    });
  }

  handleChangeDialog() {
    this.setState({ open: !this.state.open });
  }

  render() {
    const { t, classes, informationSystem } = this.props;
    const {
      open, openEdit, selectedProduct, informationTypeId,
    } = this.state;
    const integrityImpact = R.pathOr({}, ['integrity_impact'], selectedProduct);
    const availabilityImpact = R.pathOr(
      {},
      ['availability_impact'],
      selectedProduct,
    );
    const confidentialityImpact = R.pathOr(
      {},
      ['confidentiality_impact'],
      selectedProduct,
    );
    const informationTypes = R.pathOr(
      {},
      ['information_types'],
      informationSystem,
    );
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h3" color="textSecondary" gutterBottom={true}>
            {t('Information Type(s)')}
          </Typography>
          <div style={{ float: 'left', margin: '5px 0 0 5px' }}>
            <Tooltip
              title={t(
                'Identifies the details about all information types that are stored, processed, or transmitted by the system, such as privacy information, and those defined in NIST SP 800-60.',
              )}
            >
              <Information
                style={{ marginLeft: '5px' }}
                fontSize="inherit"
                color="disabled"
              />
            </Tooltip>
          </div>
          <IconButton
            size="small"
            onClick={() => this.setState({ open: true })}
          >
            <AddIcon />
          </IconButton>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40% 1fr 1fr 1fr',
            padding: '10px',
          }}
        >
          <Typography>{t('Name')}</Typography>
          <Typography>{t('Confidentiality')}</Typography>
          <Typography>{t('Integrity')}</Typography>
          <Typography>{t('Availability')}</Typography>
        </div>
        <div className={classes.scrollBg}>
          <div className={classes.scrollDiv}>
            <div className={classes.scrollObj}>
              {informationTypes
                && informationTypes.map((informationType, key) => (
                  <div key={key}>
                    <div>
                      {informationType.title && t(informationType.title)}
                    </div>
                    <div>
                      {informationType.confidentiality_impact && (
                        <RiskLevel
                          risk={
                            informationType.confidentiality_impact.base_impact
                          }
                        />
                      )}
                    </div>
                    <div>
                      {informationType.integrity_impact && (
                        <RiskLevel
                          risk={informationType.integrity_impact.base_impact}
                        />
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex' }}>
                        {informationType.availability_impact && (
                          <RiskLevel
                            risk={
                              informationType.availability_impact.base_impact
                            }
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={this.handleEditInfoType.bind(
                            this,
                            informationType.id,
                          )}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={this.handleDeleteInfoType.bind(
                            this,
                            informationType.id,
                          )}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <Dialog
          open={open}
          maxWidth="md"
          keepMounted={false}
          className={classes.dialogMain}
        >
          <Formik
            enableReinitialize
            initialValues={{
              title: '',
              system: '',
              catalog: '',
              description: '',
              information_type: '',
              integrity_impact_base: '',
              availability_impact_base: '',
              integrity_impact_selected: '',
              confidentiality_impact_base: '',
              availability_impact_selected: '',
              integrity_impact_justification: '',
              confidentiality_impact_selected: '',
              availability_impact_justification: '',
              confidentiality_impact_justification: '',
            }}
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
                          variant="h3"
                          color="textSecondary"
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
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <SearchTextField
                        name="title"
                        errors={errors.title}
                        setFieldValue={setFieldValue}
                        handleSearchTextField={this.handleSearchTextField.bind(
                          this,
                        )}
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
                        <Tooltip
                          title={t(
                            'Identifies a summary of the reponsible party purpose and associated responsibilities.',
                          )}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={MarkDownField}
                        name="description"
                        fullWidth={true}
                        multiline={true}
                        rows="3"
                        variant="outlined"
                        containerstyle={{ width: '100px' }}
                      />
                    </Grid>
                    <SecurityCategorization
                      values={values}
                      setFieldValue={setFieldValue}
                      handleInformationType={this.handleInformationType.bind(
                        this,
                      )}
                    />
                    <Grid item={true} xs={12}>
                      <div className={classes.textBase}>
                        <Typography
                          variant="h3"
                          color="textSecondary"
                          gutterBottom={true}
                          style={{ margin: 0 }}
                        >
                          {t('Confidentiality Impact')}
                        </Typography>
                        <Tooltip
                          title={
                            confidentialityImpact.explanation
                            || 'Confidentiality Impact'
                          }
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                    </Grid>
                    <Grid item={true} xs={2}>
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
                          title={confidentialityImpact.recommendation || 'Base'}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      {selectedProduct.confidentiality_impact && (
                        <RiskLevel
                          risk={
                            selectedProduct.confidentiality_impact.base_impact
                          }
                        />
                      )}
                    </Grid>
                    <Grid item={true} xs={2}>
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
                            'Override The provisional confidentiality impact level recommended for disclosure compensation management information is low.',
                          )}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="confidentiality_impact_selected"
                        taskType="FIPS199"
                        fullWidth={true}
                        required={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid xs={8} item={true}>
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
                            'Justification Identifies a summary of impact for how the risk affects the system.',
                          )}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={MarkDownField}
                        name="confidentiality_impact_justification"
                        fullWidth={true}
                        multiline={true}
                        rows="1"
                        variant="outlined"
                        containerstyle={{ width: '100%' }}
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
                          {t('Integrity Impact')}
                        </Typography>
                        <Tooltip
                          title={
                            integrityImpact.explanation || 'Integrity Impact'
                          }
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                    </Grid>
                    <Grid item={true} xs={2}>
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
                          title={integrityImpact.recommendation || 'Base'}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      {selectedProduct.integrity_impact && (
                        <RiskLevel
                          risk={selectedProduct.integrity_impact.base_impact}
                        />
                      )}
                    </Grid>
                    <Grid item={true} xs={2}>
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
                            'Override The provisional Integrity Impact level recommended for disclosure compensation management information is low.',
                          )}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="integrity_impact_selected"
                        taskType="FIPS199"
                        fullWidth={true}
                        required={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid xs={8} item={true}>
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
                            'Justification Identifies a summary of impact for how the risk affects the system.',
                          )}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={MarkDownField}
                        name="integrity_impact_justification"
                        fullWidth={true}
                        multiline={true}
                        rows="3"
                        variant="outlined"
                        containerstyle={{ width: '100%' }}
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
                          {t('Availability Impact')}
                        </Typography>
                        <Tooltip
                          title={
                            availabilityImpact.explanation
                            || 'Availability Impact'
                          }
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                    </Grid>
                    <Grid item={true} xs={2}>
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
                          title={availabilityImpact.recommendation || 'Base'}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      {selectedProduct.availability_impact && (
                        <RiskLevel
                          risk={selectedProduct.availability_impact.base_impact}
                        />
                      )}
                    </Grid>
                    <Grid item={true} xs={2}>
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
                            'Override The provisional Availability Impact level recommended for disclosure compensation management information is low.',
                          )}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <TaskType
                        name="availability_impact_selected"
                        taskType="FIPS199"
                        fullWidth={true}
                        required={true}
                        style={{ height: '38.09px' }}
                        containerstyle={{ width: '100%' }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid xs={8} item={true}>
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
                            'Justification Identifies a summary of impact for how the risk affects the system.',
                          )}
                        >
                          <Information
                            style={{ marginLeft: '5px' }}
                            fontSize="inherit"
                            color="disabled"
                          />
                        </Tooltip>
                      </div>
                      <div className="clearfix" />
                      <Field
                        component={MarkDownField}
                        name="availability_impact_justification"
                        fullWidth={true}
                        multiline={true}
                        rows="3"
                        variant="outlined"
                        containerstyle={{ width: '100%' }}
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
        {informationTypeId && (
          <QueryRenderer
            query={InformationTypeEditionQuery}
            variables={{ id: informationTypeId }}
            render={({ props, retry }) => {
              if (props) {
                return (
                  <InformationTypeEdition
                    openEdit={openEdit}
                    informationType={props.informationType}
                    handleEditInfoType={this.handleEditInfoType.bind(this)}
                  />
                );
              }
              return <div style={{ height: '100%' }}></div>;
            }}
          />
        )}
      </div>
    );
  }
}

InformationTypesCreationComponent.propTypes = {
  t: PropTypes.func,
  name: PropTypes.string,
  classes: PropTypes.object,
  informationSystem: PropTypes.object,
};

const InformationTypesCreation = createFragmentContainer(
  InformationTypesCreationComponent,
  {
    informationSystem: graphql`
      fragment InformationTypesCreation_information on InformationSystem {
        id
        information_types {
          id
          title
          confidentiality_impact {
            base_impact
          }
          integrity_impact {
            base_impact
          }
          availability_impact {
            base_impact
          }
        }
      }
    `,
  },
);

export default compose(inject18n, withStyles(styles))(InformationTypesCreation);
