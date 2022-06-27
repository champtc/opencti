/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import graphql from 'babel-plugin-relay/macro';
import {
  compose,
  dissoc,
  assoc,
  evolve,
  pipe,
} from 'ramda';
import { QueryRenderer as QR, commitMutation as CM } from 'react-relay';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';
import PublishIcon from '@material-ui/icons/Publish';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import inject18n from './i18n';
import SelectField from './SelectField';
import OscalModalTypeList from '../private/components/common/form/OscalModalTypeList';
import OscalMediaTypeList from '../private/components/common/form/OscalMediaTypeList';
import environmentDarkLight from '../../../opencti-front/src/relay/environmentDarkLight';

const styles = (theme) => ({
  dialogRoot: {
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
  button: {
    display: 'table-cell',
    float: 'left',
  },
  buttonPopover: {
    marginRight: '5px',
    textTransform: 'capitalize',
  },
  dialogContent: {
    overflowY: 'hidden',
  },
  popoverDialog: {
    fontSize: '18px',
    lineHeight: '24px',
    color: theme.palette.header.text,
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '0px 0 20px 22px',
  },
});

const ExportPoamMutation = graphql`
  mutation ExportPoamMutation(
    $model: OscalModelType!
    $mediaType: OscalMediaType
    $exportOscalId: ID
  ) {
    exportOscal(model: $model, id: $exportOscalId, media_type: $mediaType)
  }
`;

class ExportPoam extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      open: false,
      close: false,
      oscalModal: false,
    };
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleOscalModalOpen(event) {
    this.setState({ anchorEl: event.currentTarget, oscalModal: true });
  }

  handleOscalModalClose = () => {
    this.setState({ anchorEl: null, oscalModal: false });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleCancelClick() {
    this.setState({
      open: false,
      close: true,
      selectedOscalType: '',
    });
  }

  handleCancelCloseClick() {
    this.setState({ close: false });
  }

  handleOscalType(selectedOscalType) {
    this.setState({ selectedOscalType: selectedOscalType });
    if (selectedOscalType === 'poam') {
      this.setState({ open: true, anchorEl: null });
    }
  }
  
  onReset() {
    this.handleCancelClick();
  }
  onSubmit(values, { setSubmitting, resetForm }) {
    const finalValues = pipe(
      dissoc('marking'),
      // assoc('model', this.state.selectedOscalType),
    )(values);
    CM(environmentDarkLight, {
      mutation: ExportPoamMutation,
      variables: {
        model: this.state.selectedOscalType,
        mediaType: values.mediaType,
        id: '',
      },
      setSubmitting,
      onCompleted: (response) => {
        setSubmitting(false);
        resetForm();
        this.handleClose();
      },
      onError: (err) => {
        toastGenericError("Failed to export data")
        console.error(err);
      }
    });
  }

  onResetContextual() {
    this.handleClose();
  }

  render() {
    const {
      t, classes, location, history, keyword, theme,
    } = this.props;
    return (
      <>
        <IconButton
          // disabled={true}
          classes={{ root: classes.button }}
          onClick={this.handleOscalModalOpen.bind((this))}
          aria-haspopup='true'
          // onClick={this.handleClickOpen.bind(this)}
        >
          <PublishIcon fontSize="default" />
        </IconButton>
          <Menu
            anchorEl={this.state.anchorEl}
            open={Boolean(this.state.anchorEl)}
            anchorOrigin={{
              vertical: "bottom",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            onClose={this.handleOscalModalClose.bind(this)}
            >
              <OscalModalTypeList
                fullWidth={true}
                variant='outlined'
                style={{ height: '38.09px' }}
                containerstyle={{ width: '100%', left: '1307px' }}
                handleOscalType={this.handleOscalType.bind(this)}
              />
          </Menu>
        <Formik
          enableReinitialize={true}
          initialValues={{
            mediaType: '',
            marking: '',
          }}
          // validationSchema={RelatedTaskValidation(t)}
          onSubmit={this.onSubmit.bind(this)}
          onReset={this.onReset.bind(this)}
        >
          {({ submitForm, handleReset, isSubmitting }) => (
            <Dialog
              classes={{ root: classes.dialogRoot }}
              open={this.state.open}
              onClose={this.handleClose.bind(this)}
              fullWidth={true}
              maxWidth='md'
            >
              <Form>
                <DialogTitle classes={{ root: classes.dialogTitle }}>
                  {t('Export')}
                </DialogTitle>
                <DialogContent classes={{ root: classes.dialogContent }}>
                  <Grid container={true} spacing={3}>
                    <Grid item={true} xs={12}>
                      <div>
                        <div className="clearfix" />
                        <OscalMediaTypeList
                          name="mediaType"
                          fullWidth={true}
                          variant='standard'
                          label='Format'
                          style={{ height: '38.09px' }}
                          containerstyle={{ width: '100%' }}
                        />
                      </div>
                    </Grid>
                    <Grid item={true} xs={12}>
                      <div>
                        <div className="clearfix" />
                        <Field
                          disabled={true}
                          component={SelectField}
                          name="marking"
                          fullWidth={true}
                          variant='standard'
                          label='Max Marking Definition Level'
                          style={{ height: '38.09px' }}
                          containerstyle={{ width: '100%' }}
                        />
                      </div>
                    </Grid>
                    <Grid item={true} xs={9}>
                      <Typography style={{ marginTop: '15px' }}>
                        {t('An email with a download link will be sent to your email')}
                      </Typography>
                    </Grid>
                    <Grid item={true} xs={3}>
                      <DialogActions>
                        <Button
                          variant="outlined"
                          onClick={handleReset}
                          disabled={isSubmitting}
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
                    </Grid>
                  </Grid>
                </DialogContent>
              </Form>
            </Dialog>
          )}
        </Formik>
      </>
    );
  }
}

ExportPoam.propTypes = {
  keyword: PropTypes.string,
  theme: PropTypes.object,
  classes: PropTypes.object,
  location: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
};

export default compose(
  inject18n,
  withStyles(styles),
)(ExportPoam);