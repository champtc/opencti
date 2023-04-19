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
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { Chip } from '@material-ui/core';
import Slide from '@material-ui/core/Slide';
import inject18n from '../../../../../components/i18n';
import { commitMutation } from '../../../../../relay/environment';
import { adaptFieldValue } from '../../../../../utils/String';
import TextField from '../../../../../components/TextField';
import DatePickerField from '../../../../../components/DatePickerField';
import { toastGenericError } from '../../../../../utils/bakedToast';
import MarkDownField from '../../../../../components/MarkDownField';
import TaskType from '../../../common/form/TaskType';
import ColorPickerField from '../../../../../components/ColorPickerField';

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

const dataMarkingEntityEditionContainerMutation = graphql`
  mutation DataMarkingEntityEditionContainerMutation(
    $id: ID!
    $input: [EditInput]!
  ) {
    editDataMarking(id: $id, input: $input) {
      ... on DataMarkingObject {
        id
        entity_type
        created
        modified
        definition_type
        color
      }
      ... on StatementMarking {
        description
        statement
        name
      }
      ... on TLPMarking {
        id
        description
        color
        created
        description
        definition_type
        entity_type
        modified
        name
        tlp
      }
      ... on IEPMarking {
        id
        entity_type
        definition_type
        description
        created
        color
        attribution
        encrypt_in_transit
        end_date
        iep_version
        modified
        name
        tlp
        unmodified_resale
        start_date
        permitted_actions
        affected_party_notifications
      }
    }
  }
`;

const tlpColor = {
  red: '#FF2B2B',
  amber: '#FFC000',
  amber_strict: '#FFC000',
  green: '#33FF00',
  clear: '#FFFFFF',
};

const DataMarkingEditionValidation = (t, type) => {
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

class DataMarkingEntityEditionContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      details: false,
      close: false,
      onSubmit: false,
      disableSubmit: false,
    };
  }

  handleOpen(event) {
    this.setState({ anchorEl: event.currentTarget });
    event.stopPropagation();
  }

  handleClose() {
    this.setState({ anchorEl: null });
  }

  handleSubmit() {
    this.setState({ onSumbit: true });
  }

  onReset() {
    this.props.handleDisplayEdit();
  }

  handleCancelCloseClick() {
    this.setState({ close: false });
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

    const finalValues = R.pipe(
      R.toPairs,
      R.map((n) => ({
        key: n[0],
        value: adaptFieldValue(n[1]),
      })),
    )(values.definition_type === 'statement' ? finalValuesForStatement : finalValuesForIEP);

    DataMarkingEditionValidation(this.props.t, values.definition_type)
      .validate(values, { abortEarly: false })
      .then(() => {
        commitMutation({
          mutation: dataMarkingEntityEditionContainerMutation,
          variables: {
            id: this.props.dataMarking.id,
            input: finalValues,
          },
          setSubmitting,
          pathname: '/data/entities/data_markings',
          onCompleted: () => {
            setSubmitting(false);
            this.setState({ disableSubmit: false });
            resetForm();
            this.handleClose();
            this.props.history.push(
              `/data/entities/data_markings/${this.props.dataMarking.id}`,
            );
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

  renderStatementMarking() {
    const { t } = this.props;
    return (
      <Grid item={true} xs={12}>
        <div style={{ marginBottom: '10px' }}>
          <Typography
            variant='h3'
            color='textSecondary'
            gutterBottom={true}
            style={{ float: 'left' }}
          >
            {t('Statement')}
          </Typography>
          <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
            <Tooltip title={t('Statement')}>
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
        </div>
      </Grid>
    );
  }

  renderIEPMarking() {
    const { t } = this.props;
    return (
      <>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
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
                <Information fontSize='inherit' color='disabled' />
              </Tooltip>
            </div>
            <div className='clearfix' />
            <Field
              component={TextField}
              name='iep_version'
              fullWidth={true}
              disabled={true}
              size='small'
              containerstyle={{ width: '100%' }}
              variant='outlined'
            />
          </div>
        </Grid>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
            <Typography
              variant='h3'
              color='textSecondary'
              gutterBottom={true}
              style={{ float: 'left' }}
            >
              {t('Start Date')}
            </Typography>
            <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
              <Tooltip title={t('Start Date')}>
                <Information fontSize='inherit' color='disabled' />
              </Tooltip>
            </div>
            <div className='clearfix' />
            <Field
              component={DatePickerField}
              name='start_date'
              fullWidth={true}
              size='small'
              containerstyle={{ width: '100%' }}
              variant='outlined'
              invalidDateMessage={t('The value must be a date (YYYY-MM-DD)')}
              style={{ height: '38.09px' }}
            />
          </div>
        </Grid>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
            <Typography
              variant='h3'
              color='textSecondary'
              gutterBottom={true}
              style={{ float: 'left' }}
            >
              {t('End Date')}
            </Typography>
            <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
              <Tooltip title={t('End Date')}>
                <Information fontSize='inherit' color='disabled' />
              </Tooltip>
            </div>
            <div className='clearfix' />
            <Field
              component={DatePickerField}
              name='end_date'
              fullWidth={true}
              size='small'
              containerstyle={{ width: '100%' }}
              variant='outlined'
              invalidDateMessage={t('The value must be a date (YYYY-MM-DD)')}
              style={{ height: '38.09px' }}
            />
          </div>
        </Grid>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
            <Typography
              variant='h3'
              color='textSecondary'
              gutterBottom={true}
              style={{ float: 'left' }}
            >
              {t('Encrypt in Transit')}
            </Typography>
            <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
              <Tooltip title={t('Encrypt in Transit')}>
                <Information fontSize='inherit' color='disabled' />
              </Tooltip>
            </div>
            <div className='clearfix' />
            <TaskType
              name='encrypt_in_transit'
              taskType='EncryptInTransit'
              fullWidth={true}
              required={true}
              style={{ height: '18.09px' }}
              containerstyle={{ width: '100%' }}
            />
          </div>
        </Grid>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
            <Typography
              variant='h3'
              color='textSecondary'
              gutterBottom={true}
              style={{ float: 'left' }}
            >
              {t('Affect Party Notifications')}
            </Typography>
            <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
              <Tooltip title={t('Affect Party Notifications')}>
                <Information fontSize='inherit' color='disabled' />
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
          </div>
        </Grid>
        <Grid item={true} xs={12}>
          <div style={{ marginBottom: '10px' }}>
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
                <Information fontSize='inherit' color='disabled' />
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
          </div>
        </Grid>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
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
                <Information fontSize='inherit' color='disabled' />
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
          </div>
        </Grid>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
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
                <Information fontSize='inherit' color='disabled' />
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
          </div>
        </Grid>
        <Grid item={true} xs={6}>
          <div style={{ marginBottom: '10px' }}>
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
                <Information fontSize='inherit' color='disabled' />
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
          </div>
        </Grid>
      </>
    );
  }

  render() {
    const {
      classes, t, fldt, dataMarking,
    } = this.props;
    const initialValues = R.pipe(
      R.assoc('id', dataMarking?.id),
      R.assoc('tlp', dataMarking?.tlp || null),
      R.assoc('name', dataMarking?.name || null),
      R.assoc('color', dataMarking?.color || ''),
      R.assoc('created', dataMarking?.created || null),
      R.assoc('modified', dataMarking?.modified || null),
      R.assoc('end_date', dataMarking?.end_date || null),
      R.assoc('start_date', dataMarking?.start_date || ''),
      R.assoc('statement', dataMarking?.statement),
      R.assoc('iep_version', dataMarking?.iep_version || ''),
      R.assoc('description', dataMarking?.description || null),
      R.assoc('attribution', dataMarking?.attribution || ''),
      R.assoc('definition_type', dataMarking?.definition_type || null),
      R.assoc('permitted_actions', dataMarking?.permitted_actions || ''),
      R.assoc('unmodified_resale', dataMarking?.unmodified_resale),
      R.assoc('encrypt_in_transit', dataMarking?.encrypt_in_transit || null),
      R.assoc(
        'affected_party_notifications',
        dataMarking?.affected_party_notifications || null,
      ),
      R.pick([
        'id',
        'tlp',
        'name',
        'color',
        'created',
        'modified',
        'end_date',
        'start_date',
        'statement',
        'iep_version',
        'description',
        'attribution',
        'definition_type',
        'permitted_actions',
        'unmodified_resale',
        'encrypt_in_transit',
        'affected_party_notifications',
      ]),
    )(dataMarking);
    return (
      <>
        {dataMarking.definition_type === 'tlp' ? (
          <Dialog
            open={this.props.displayEdit}
            keepMounted={true}
            className={classes.dialogMain}
          >
            <DialogTitle classes={{ root: classes.dialogTitle }}>
              {t('Marking')}
            </DialogTitle>
            <DialogContent classes={{ root: classes.dialogContent }}>
              <Grid container={true} spacing={3}>
                <Grid item={true} xs={12}>
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
                  {dataMarking?.id && t(dataMarking?.id)}
                </Grid>
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
                    {dataMarking?.created && fldt(dataMarking.created)}
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
                    {dataMarking?.modified && fldt(dataMarking?.modified)}
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
                  {dataMarking?.definition_type && t(dataMarking?.definition_type)}
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
                  {dataMarking?.name && t(dataMarking?.name)}
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
                  <div className={classes.scrollBg}>
                    <div className={classes.scrollDiv}>
                      <div className={classes.scrollObj}>
                        <Markdown
                          remarkPlugins={[remarkGfm, remarkParse]}
                          rehypePlugins={[rehypeRaw]}
                          parserOptions={{ commonmark: true }}
                          className='markdown'
                        >
                          {dataMarking?.description
                            && t(dataMarking.description)}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                </Grid>
                <Grid item={true} xs={12}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('Color')}
                  </Typography>
                  <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                    <Tooltip title={t('Color')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                  <div className='clearfix' />
                  {dataMarking?.color && t(dataMarking?.color)}
                </Grid>
                <Grid item={true} xs={12}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
                    gutterBottom={true}
                    style={{ float: 'left' }}
                  >
                    {t('TLP Level')}
                  </Typography>
                  <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                    <Tooltip title={t('TLP Level')}>
                      <Information fontSize='inherit' color='disabled' />
                    </Tooltip>
                  </div>
                  <div className='clearfix' />
                  <Chip style={{
                    backgroundColor: '#000', borderRadius: 0, padding: 10, color: tlpColor[dataMarking?.tlp] || '#FF2B2B',
                  }} size="small" label={dataMarking?.tlp && `TLP : ${t(dataMarking?.tlp).toUpperCase()}`} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions classes={{ root: classes.dialogClosebutton }}>
              <Button
                variant='outlined'
                onClick={() => this.props.handleDisplayEdit()}
                classes={{ root: classes.buttonPopover }}
              >
                {t('Cancel')}
              </Button>
            </DialogActions>
          </Dialog>
        ) : (
          <Dialog
            open={this.props.displayEdit}
            keepMounted={true}
            className={classes.dialogMain}
          >
            <Formik
              enableReinitialize={true}
              initialValues={initialValues}
              validationSchema={DataMarkingEditionValidation(t)}
              onSubmit={this.onSubmit.bind(this)}
              onReset={this.onReset.bind(this)}
            >
              {({ submitForm, handleReset }) => (
                <Form>
                  <DialogTitle classes={{ root: classes.dialogTitle }}>
                    {t('Marking')}
                  </DialogTitle>
                  <DialogContent classes={{ root: classes.dialogContent }}>
                    <Grid container={true} spacing={3}>
                      <Grid item={true} xs={12}>
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
                          disabled={true}
                          fullWidth={true}
                          size='small'
                          containerstyle={{ width: '100%' }}
                          variant='outlined'
                        />
                      </Grid>
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
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
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
                              <Information
                                fontSize='inherit'
                                color='disabled'
                              />
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
                          disabled={true}
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
                      <Grid
                        item={true}
                        xs={
                          dataMarking.definition_type === 'statement' ? 12 : 6
                        }
                      >
                        <Typography
                          variant='h3'
                          color='textSecondary'
                          gutterBottom={true}
                          style={{ float: 'left' }}
                        >
                          {t('Color')}
                        </Typography>
                        <div style={{ float: 'left', margin: '1px 0 0 5px' }}>
                          <Tooltip title={t('Color')}>
                            <Information fontSize='inherit' color='disabled' />
                          </Tooltip>
                        </div>
                        <div className='clearfix' />
                        <Field
                          component={ColorPickerField}
                          name='color'
                          fullWidth={true}
                        />
                      </Grid>
                      {dataMarking.definition_type === 'statement'
                        && this.renderStatementMarking()}
                      {dataMarking.definition_type === 'iep'
                        && this.renderIEPMarking()}
                    </Grid>
                  </DialogContent>
                  <DialogActions classes={{ root: classes.dialogClosebutton }}>
                    <Button
                      variant='outlined'
                      onClick={handleReset}
                      // onClick={() => this.props.handleDisplayEdit()}
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
        )}
      </>
    );
  }
}

DataMarkingEntityEditionContainer.propTypes = {
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
)(DataMarkingEntityEditionContainer);
