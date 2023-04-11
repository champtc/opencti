/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  compose,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';
import {
  Share,
  ArrowBack,
  Landscape,
  PictureAsPdf,
} from '@material-ui/icons';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import inject18n from '../../../../components/i18n';

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

const styles = (theme) => ({
  header: {
    margin: '0 -1.5rem 1rem -1.5rem',
    padding: '1.5rem',
    height: '70px',
    backgroundColor: theme.palette.background.paper,
  },
  iconButton: {
    float: 'left',
    minWidth: '0px',
    marginRight: 15,
    padding: '7px',
  },
  title: {
    float: 'left',
  },
  aliases: {
    display: 'flex',
    float: 'right',
    marginTop: '-5px',
  },
  alias: {
    marginRight: 7,
  },
});

class CyioDomainObjectAnalysisHeader extends Component {
  render() {
    const {
      t,
      name,
      goBack,
      classes,
      history,
    } = this.props;
    return (
      <div className={classes.header}>
        <Tooltip title={t('Back')} style={{ marginTop: -5 }}>
          <Button
            size='large'
            variant='outlined'
            className={classes.iconButton}
            onClick={() => history.push(goBack)}
          >
            <ArrowBack fontSize='inherit' />
          </Button>
        </Tooltip>
        <Typography
          variant='h1'
          gutterBottom={true}
          classes={{ root: classes.title }}
        >
          {name}
        </Typography>
        <div className={classes.aliases}>
          <Tooltip title={t('Share')}>
            <Button
              size='large'
              color='primary'
              variant='contained'
              className={classes.iconButton}
            >
              <Share fontSize='small' />
            </Button>
          </Tooltip>
          <Tooltip title={t('Image')}>
            <Button
              size='large'
              color='primary'
              variant='contained'
              className={classes.iconButton}
            >
              <Landscape fontSize='small' />
            </Button>
          </Tooltip>
          <Tooltip title={t('Image')}>
            <Button
              size='large'
              color='primary'
              variant='contained'
              className={classes.iconButton}
            >
              <PictureAsPdf fontSize='small' />
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }
}

CyioDomainObjectAnalysisHeader.propTypes = {
  name: PropTypes.string,
  variant: PropTypes.string,
  classes: PropTypes.object,
  goBack: PropTypes.string,
  t: PropTypes.func,
  disabled: PropTypes.bool,
  fld: PropTypes.func,
};

export default compose(inject18n, withStyles(styles))(CyioDomainObjectAnalysisHeader);