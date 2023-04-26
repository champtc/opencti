import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Grid,
} from '@material-ui/core';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import inject18n from '../../../../components/i18n';
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
});

class InformationTypeDetailsPopover extends Component {
  handleClose() {
    this.props.handleDisplay();
  }

  render() {
    const {
      t, classes, openDetails, informationType,
    } = this.props;
    const integrityImpact = R.pathOr({}, ['integrity_impact'], informationType);
    const availabilityImpact = R.pathOr(
      {},
      ['availability_impact'],
      informationType,
    );
    const confidentialityImpact = R.pathOr(
      {},
      ['confidentiality_impact'],
      informationType,
    );
    const categorizations = R.pipe(
      R.pathOr([], ['categorizations']),
      R.mergeAll,
    )(informationType);
    return (
      <>
        <Dialog
          open={openDetails}
          maxWidth='md'
          keepMounted={false}
          className={classes.dialogMain}
        >
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {informationType?.title && t(informationType?.title)}
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {informationType?.description
                  && t(informationType?.description)}
              </Grid>
              <Grid item={true} xs={4}>
                <div className={classes.textBase}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
                    gutterBottom={true}
                    style={{ margin: 0 }}
                  >
                    {t('Categorization System')}
                  </Typography>
                  <Tooltip
                    title={t(
                      'Identifies a set of references to information type information, such as NIST SP 800-60.',
                    )}
                  >
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {categorizations?.catalog?.title && t(categorizations?.catalog?.title)}
              </Grid>
              <Grid item={true} xs={4}>
                <div className={classes.textBase}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
                    gutterBottom={true}
                    style={{ margin: 0 }}
                  >
                    {t('Category')}
                  </Typography>
                  <Tooltip
                    title={t(
                      'Identifies a categorization of an information type.',
                    )}
                  >
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {categorizations?.information_type?.category
                     && t(categorizations?.information_type?.category)}
              </Grid>
              <Grid item={true} xs={4}>
                <div className={classes.textBase}>
                  <Typography
                    variant='h3'
                    color='textSecondary'
                    gutterBottom={true}
                    style={{ margin: 0 }}
                  >
                    {t('Information Type')}
                  </Typography>
                  <Tooltip
                    title={t(
                      'Identifies a unique identifier, qualified by the given identification system used, for an information type.',
                    )}
                  >
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {categorizations?.information_type?.title
                     && t(categorizations?.information_type?.title)}
              </Grid>
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
                    title={
                      confidentialityImpact.explanation
                      || 'Confidentiality Impact'
                    }
                  >
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {confidentialityImpact?.base_impact && (
                  <RiskLevel risk={confidentialityImpact?.base_impact} />
                )}
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {confidentialityImpact?.selected_impact && (
                  <RiskLevel risk={confidentialityImpact?.selected_impact} />
                )}
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
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
                        {confidentialityImpact.adjustment_justification
                          && t(confidentialityImpact.adjustment_justification)}
                      </Markdown>
                    </div>
                  </div>
                </div>
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
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
                  <Tooltip title={integrityImpact.recommendation || 'Base'}>
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {integrityImpact?.base_impact && (
                  <RiskLevel risk={integrityImpact?.base_impact} />
                )}
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {integrityImpact?.selected_impact && (
                  <RiskLevel risk={integrityImpact?.selected_impact} />
                )}
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
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
                        {integrityImpact.adjustment_justification
                          && t(integrityImpact.adjustment_justification)}
                      </Markdown>
                    </div>
                  </div>
                </div>
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
                    title={
                      availabilityImpact.explanation || 'Availability Impact'
                    }
                  >
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
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
                  <Tooltip title={availabilityImpact.recommendation || 'Base'}>
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {availabilityImpact?.selected_impact && (
                  <RiskLevel risk={availabilityImpact?.selected_impact} />
                )}
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
                  </Tooltip>
                </div>
                <div className='clearfix' />
                {availabilityImpact?.selected_impact && (
                  <RiskLevel risk={availabilityImpact?.selected_impact} />
                )}
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
                    <Information
                      style={{ marginLeft: '5px' }}
                      fontSize='inherit'
                      color='disabled'
                    />
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
                        {availabilityImpact.adjustment_justification
                          && t(availabilityImpact.adjustment_justification)}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions classes={{ root: classes.dialogClosebutton }}>
            <Button
              variant='outlined'
              onClick={this.handleClose.bind(this)}
              classes={{ root: classes.buttonPopover }}
            >
              {t('Cancel')}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

InformationTypeDetailsPopover.propTypes = {
  t: PropTypes.func,
  classes: PropTypes.object,
  openDetails: PropTypes.bool,
  informationType: PropTypes.object,
};

export default compose(
  inject18n,
  withStyles(styles),
)(InformationTypeDetailsPopover);
