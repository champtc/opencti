import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import graphql from 'babel-plugin-relay/macro';
import * as R from 'ramda';
import * as Yup from 'yup';
import { withTheme, withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import { Close, ArrowRightAlt, ArrowBack } from '@material-ui/icons';
import { commitMutation } from '../../../../../relay/environment';
import inject18n from '../../../../../components/i18n';
import { itemColor } from '../../../../../utils/Colors';
import { parse } from '../../../../../utils/Time';
import ItemIcon from '../../../../../components/ItemIcon';
import MarkDownField from '../../../../../components/MarkDownField';
import SelectField from '../../../../../components/SelectField';
import DatePickerField from '../../../../../components/DatePickerField';
import { truncate } from '../../../../../utils/String';
import ConfidenceField from '../../../common/form/ConfidenceField';

const styles = (theme) => ({
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    // backgroundColor: theme.palette.navAlt.background,
    padding: 0,
  },
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
    zIndex: 2000,
  },
  buttons: {
    marginTop: 20,
    textAlign: 'left',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  header: {
    display: 'flex',
    // backgroundColor: theme.palette.navAlt.backgroundHeader,
    // color: theme.palette.navAlt.backgroundHeaderText,
    padding: '20px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
    color: 'inherit',
  },
  importButton: {
    position: 'absolute',
    top: 15,
    right: 20,
  },
  container: {
    padding: '10px 20px 20px 20px',
  },
  item: {
    position: 'absolute',
    width: 180,
    height: 80,
    borderRadius: 10,
  },
  itemHeader: {
    padding: '10px 0 10px 0',
  },
  icon: {
    position: 'absolute',
    top: 8,
    left: 5,
    fontSize: 8,
  },
  type: {
    width: '100%',
    textAlign: 'center',
    color: theme.palette.text.primary,
    fontSize: 11,
  },
  iconButton: {
    minWidth: '0px',
    marginRight: 15,
    padding: '7px',
  },
  content: {
    width: '100%',
    height: 40,
    maxHeight: 40,
    lineHeight: '40px',
    color: theme.palette.text.primary,
    textAlign: 'center',
  },
  name: {
    display: 'inline-block',
    lineHeight: 1,
    fontSize: 12,
    verticalAlign: 'middle',
  },
  relation: {
    position: 'relative',
    height: 100,
    transition: 'background-color 0.1s ease',
    cursor: 'pointer',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.1)',
    },
    padding: 10,
    marginBottom: 10,
  },
  relationCreation: {
    position: 'relative',
    height: 100,
    transition: 'background-color 0.1s ease',
    cursor: 'pointer',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.1)',
    },
    padding: 10,
  },
  textField: {
    '& fieldset': {
      borderRadius: '10px 10px 0px 0px',
    },
  },
  typography: {
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid grey',
    borderRadius: '0px 0px 10px 10px',
  },
  relationCreate: {
    position: 'relative',
    height: 100,
  },
  middle: {
    margin: '0 auto',
    width: 200,
    textAlign: 'center',
    padding: 0,
    color: theme.palette.text.primary,
  },
});

const cyioCoreRelationshipCreationMutation = graphql`
  mutation CyioCoreRelationshipCreationMutation(
    $input: StixCoreRelationshipAddInput!
  ) {
    stixCoreRelationshipAdd(input: $input) {
      id
      entity_type
      parent_types
      relationship_type
      confidence
      start_time
      stop_time
      from {
        ... on BasicObject {
          id
          entity_type
          parent_types
        }
        ... on BasicRelationship {
          id
          entity_type
          parent_types
        }
        ... on StixCoreRelationship {
          relationship_type
        }
      }
      to {
        ... on BasicObject {
          id
          entity_type
          parent_types
        }
        ... on BasicRelationship {
          id
          entity_type
          parent_types
        }
        ... on StixCoreRelationship {
          relationship_type
        }
      }
      created_at
      updated_at
      createdBy {
        ... on Identity {
          id
          name
          entity_type
        }
      }
      objectMarking {
        edges {
          node {
            id
            definition
          }
        }
      }
    }
  }
`;

const cyioCoreRelationshipValidation = (t) => Yup.object().shape({
  relationship_type: Yup.string().required(t('This field is required')),
  confidence: Yup.number()
    .typeError(t('The value must be a number'))
    .integer(t('The value must be a number')),
  start_time: Yup.date()
    .nullable()
    .default(null)
    .typeError(t('The value must be a date (YYYY-MM-DD)')),
  stop_time: Yup.date()
    .nullable()
    .default(null)
    .typeError(t('The value must be a date (YYYY-MM-DD)')),
  description: Yup.string(),
});

class CyioCoreRelationshipCreation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 0,
      existingRelations: [],
    };
  }

  onSubmit(values, { setSubmitting, resetForm }) {
    R.forEach((fromObject) => {
      R.forEach((toObject) => {
        const finalValues = R.pipe(
          R.assoc('fromId', fromObject.id),
          R.assoc('toId', toObject.id),
          R.assoc(
            'start_time',
            values.start_time ? parse(values.start_time).format() : null,
          ),
          R.assoc(
            'stop_time',
            values.stop_time ? parse(values.stop_time).format() : null,
          ),
          R.assoc('createdBy', values.createdBy?.value),
          R.assoc('killChainPhases', R.pluck('value', values.killChainPhases)),
          R.assoc('objectMarking', R.pluck('value', values.objectMarking)),
          R.assoc(
            'externalReferences',
            R.pluck('value', values.externalReferences),
          ),
        )(values);
        commitMutation({
          mutation: cyioCoreRelationshipCreationMutation,
          variables: {
            input: finalValues,
          },
          setSubmitting,
          onCompleted: (response) => {
            this.props.handleResult(response.cyioCoreRelationshipAdd);
          },
        });
      }, this.props.toObjects);
    }, this.props.fromObjects);
    setSubmitting(false);
    resetForm();
    this.handleClose();
  }

  handleSelectRelation(relation) {
    this.props.handleResult(relation);
    this.handleClose();
  }

  handleChangeStep() {
    this.setState({ step: 2 });
  }

  handleReverseRelation() {
    this.setState({ existingRelations: [], step: 0 }, () => this.props.handleReverseRelation());
  }

  handleClose() {
    this.setState({ existingRelations: [], step: 0 });
    this.props.handleClose();
  }

  renderForm() {
    const {
      t,
      classes,
      fromObjects,
      toObjects,
      confidence,
      startTime,
      stopTime,
      defaultCreatedBy,
      defaultMarkingDefinitions,
    } = this.props;
    const initialValues = {
      relationship_type: '',
      confidence: '',
      start_time: '',
      stop_time: '',
      description: '',
    };
    return (
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={cyioCoreRelationshipValidation(t)}
        onSubmit={this.onSubmit.bind(this)}
      >
        {({ submitForm, isSubmitting, setFieldValue }) => (
          <Form>
            <div className={classes.container}>
              <div className={classes.header}>
                <Button
                  size='small'
                  variant='contained'
                  color='primary'
                  aria-label="Close"
                  className={classes.iconButton}
                  onClick={this.handleClose.bind(this)}
                >
                  <ArrowBack />
                </Button>
                <Typography variant="h6">{t('Create a relationship')}</Typography>
              </div>
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <TextField
                    className={classes.textField}
                    fullWidth
                    variant='outlined'
                    id='outlined-basic'
                  />
                  <Typography classes={{ root: classes.typography }}>
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Button
                    size='small'
                    variant='contained'
                    color='primary'
                    aria-label='Close'
                    className={classes.iconButton}
                  // onClick={this.handleClose.bind(this)}
                  >
                    {t('REVERSE')}
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    className={classes.textField}
                    fullWidth
                    variant='outlined'
                    id='outlined-basic'
                  />
                  <Typography classes={{ root: classes.typography }}>
                  </Typography>
                </Grid>
              </Grid>
              <Field
                component={SelectField}
                name='relationship_type'
                label={t('Relationship type')}
                fullWidth={true}
                containerstyle={{ marginTop: 20, width: '100%' }}
              />
              <ConfidenceField
                name="confidence"
                label={t('Confidence level')}
                fullWidth={true}
                containerstyle={{ marginTop: 20, width: '100%' }}
              />
              <Field
                component={DatePickerField}
                name="start_time"
                label={t('Start time')}
                invalidDateMessage={t('The value must be a date (YYYY-MM-DD)')}
                fullWidth={true}
                style={{ marginTop: 20 }}
              />
              <Field
                component={DatePickerField}
                name="stop_time"
                label={t('Stop time')}
                invalidDateMessage={t('The value must be a date (YYYY-MM-DD)')}
                fullWidth={true}
                style={{ marginTop: 20 }}
              />
              <Field
                component={MarkDownField}
                name="description"
                label={t('Description')}
                fullWidth={true}
                multiline={true}
                rows="4"
                style={{ marginTop: 20 }}
              />
              <div className={classes.buttons}>
                <Button
                  variant="outlined"
                  onClick={this.handleClose.bind(this)}
                  disabled={isSubmitting}
                  classes={{ root: classes.button }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={submitForm}
                  disabled={isSubmitting}
                  classes={{ root: classes.button }}
                >
                  {t('Create')}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    );
  }

  renderSelectRelation() {
    const {
      fsd, t, classes, fromObjects, toObjects, theme,
    } = this.props;
    const { existingRelations } = this.state;
    return (
      <div>
        <div className={classes.header}>
          <IconButton
            aria-label="Close"
            className={classes.closeButton}
            onClick={this.handleClose.bind(this)}
          >
            <Close fontSize="small" />
          </IconButton>
          <Typography variant="h6">{t('Select a relationship')}</Typography>
        </div>
        <div className={classes.container}>
          {existingRelations.map((relation) => (
            <div
              key={relation.node.id}
              className={classes.relation}
              onClick={this.handleSelectRelation.bind(this, relation.node)}
            >
              <div
                className={classes.item}
                style={{
                  border: `2px solid ${itemColor(fromObjects[0].entity_type)}`,
                  top: 10,
                  left: 10,
                }}
              >
                <div
                  className={classes.itemHeader}
                  style={{
                    borderBottom: `1px solid ${itemColor(
                      fromObjects[0].entity_type,
                    )}`,
                  }}
                >
                  <div className={classes.icon}>
                    <ItemIcon
                      type={fromObjects[0].entity_type}
                      color={itemColor(fromObjects[0].entity_type)}
                      size="small"
                    />
                  </div>
                  <div className={classes.type}>
                    {fromObjects[0].relationship_type
                      ? t('Relationship')
                      : t(`entity_${fromObjects[0].entity_type}`)}
                  </div>
                </div>
                <div className={classes.content}>
                  <span className={classes.name}>
                    {fromObjects.length > 1 ? (
                      <em>{t('Multiple entities selected')}</em>
                    ) : (
                      truncate(fromObjects[0].name, 20)
                    )}
                  </span>
                </div>
              </div>
              <div className={classes.middle}>
                <ArrowRightAlt fontSize="small" />
                <br />
                <Tooltip
                  title={relation.node.description}
                  aria-label="Description"
                  placement="top"
                >
                  <div
                    style={{
                      padding: '5px 8px 5px 8px',
                      backgroundColor: theme.palette.background.paperLight,
                      color: theme.palette.text.primary,
                      fontSize: 12,
                      display: 'inline-block',
                    }}
                  >
                    {t(`relationship_${relation.node.relationship_type}`)}
                    <br />
                    {t('First obs.')} {fsd(relation.node.start_time)}
                    <br />
                    {t('Last obs.')} {fsd(relation.node.stop_time)}
                  </div>
                </Tooltip>
              </div>
              <div
                className={classes.item}
                style={{
                  border: `2px solid ${itemColor(toObjects[0].entity_type)}`,
                  top: 10,
                  right: 10,
                }}
              >
                <div
                  className={classes.itemHeader}
                  style={{
                    borderBottom: `1px solid ${itemColor(
                      toObjects[0].entity_type,
                    )}`,
                  }}
                >
                  <div className={classes.icon}>
                    <ItemIcon
                      type={toObjects[0].entity_type}
                      color={itemColor(toObjects[0].entity_type)}
                      size="small"
                    />
                  </div>
                  <div className={classes.type}>
                    {toObjects[0].relationship_type
                      ? t('Relationship')
                      : t(`entity_${toObjects[0].entity_type}`)}
                  </div>
                </div>
                <div className={classes.content}>
                  <span className={classes.name}>
                    {truncate(toObjects[0].name, 20)}
                  </span>
                </div>
              </div>
              <div className="clearfix" />
            </div>
          ))}
          <div
            className={classes.relationCreation}
            onClick={this.handleChangeStep.bind(this)}
          >
            <div
              className={classes.item}
              style={{
                backgroundColor: theme.palette.background.paperLight,
                top: 10,
                left: 10,
              }}
            >
              <div
                className={classes.itemHeader}
                style={{
                  borderBottom: '1px solid #ffffff',
                }}
              >
                <div className={classes.icon}>
                  <ItemIcon
                    type={fromObjects[0].entity_type}
                    color="#263238"
                    size="small"
                  />
                </div>
                <div className={classes.type}>
                  {t(`entity_${fromObjects[0].entity_type}`)}
                </div>
              </div>
              <div className={classes.content}>
                <span className={classes.name}>
                  {fromObjects.length > 1 ? (
                    <em>{t('Multiple entities selected')}</em>
                  ) : (
                    truncate(fromObjects[0].name)
                  )}
                </span>
              </div>
            </div>
            <div className={classes.middle} style={{ paddingTop: 15 }}>
              <ArrowRightAlt fontSize="small" />
              <br />
              <div
                style={{
                  padding: '5px 8px 5px 8px',
                  backgroundColor: theme.palette.background.paperLight,
                  color: theme.palette.text.primary,
                  fontSize: 12,
                  display: 'inline-block',
                }}
              >
                {t('Create a relationship')}
              </div>
            </div>
            <div
              className={classes.item}
              style={{
                backgroundColor: theme.palette.background.paperLight,
                top: 10,
                right: 10,
              }}
            >
              <div
                className={classes.itemHeader}
                style={{
                  borderBottom: '1px solid #ffffff',
                }}
              >
                <div className={classes.icon}>
                  <ItemIcon
                    type={toObjects[0].entity_type}
                    color="#263238"
                    size="small"
                  />
                </div>
                <div className={classes.type}>
                  {t(`entity_${toObjects[0].entity_type}`)}
                </div>
              </div>
              <div className={classes.content}>
                <span className={classes.name}>
                  {toObjects.length > 1 ? (
                    <em>{t('Multiple entities selected')}</em>
                  ) : (
                    truncate(toObjects[0].name, 20)
                  )}
                </span>
              </div>
            </div>
            <div className="clearfix" />
          </div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line
  renderLoader() {
    return (
      <div style={{ display: 'table', height: '100%', width: '100%' }}>
        <span
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
            textAlign: 'center',
          }}
        >
          <CircularProgress size={80} thickness={2} />
        </span>
      </div>
    );
  }

  render() {
    const {
      open, fromObject, toObjects, classes,
    } = this.props;
    const { step } = this.state;
    return (
      <Drawer
        open={open}
        anchor="right"
        classes={{ paper: classes.drawerPaper }}
        onClose={this.handleClose.bind(this)}
      >
        {this.renderForm()}
        {/* {step === 0
        || step === undefined
        || fromObject === null
        || toObjects === null
          ? this.renderLoader()
          : ''} */}
        {/* {step === 1 ? this.renderSelectRelation() : ''} */}
        {/* {step === 2 ? this.renderForm() : ''} */}
      </Drawer>
    );
  }
}

CyioCoreRelationshipCreation.propTypes = {
  open: PropTypes.bool,
  fromObjects: PropTypes.object,
  toObjects: PropTypes.array,
  handleResult: PropTypes.func,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
  fsd: PropTypes.func,
  startTime: PropTypes.string,
  stopTime: PropTypes.string,
  confidence: PropTypes.number,
  defaultCreatedBy: PropTypes.object,
  defaultMarkingDefinitions: PropTypes.object,
  handleClose: PropTypes.func,
  handleReverseRelation: PropTypes.func,
};

export default R.compose(
  inject18n,
  withTheme,
  withStyles(styles),
)(CyioCoreRelationshipCreation);
