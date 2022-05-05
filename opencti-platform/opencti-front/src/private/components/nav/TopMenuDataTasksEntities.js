/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { PublicOutlined, LaptopChromebookOutlined } from '@material-ui/icons';
import { DiamondOutline, ChessKnight } from 'mdi-material-ui';
import inject18n from '../../../components/i18n';
import deviceIcon from '../../../resources/images/assets/deviceIcon.svg';
import networkIcon from '../../../resources/images/assets/networkIcon.svg';
import softwareIcon from '../../../resources/images/assets/softwareIcon.svg';

const styles = (theme) => ({
  button: {
    marginRight: theme.spacing(1),
    padding: '4px 25px',
    minHeight: 20,
    minWidth: 20,
    width: 180,
    textTransform: 'none',
    borderRadius: '8px 8px 0px 0px',
  },
  icon: {
    marginRight: theme.spacing(1),
  },
});

class TopMenuDataTasksEntities extends Component {
  render() {
    const { t, location, classes } = this.props;
    return (
      <div>
        <Button
          component={Link}
          to="/data/entities/tasks"
          variant={
            location.pathname.includes('/data/entities/tasks')
              ? 'contained'
              : 'text'
          }
          size="small"
          color={
            location.pathname.includes('/data/entities/tasks')
              ? 'secondary'
              : 'inherit'
          }
          classes={{ root: classes.button }}
        >
          {t('Entities')}
        </Button>
        <Button
          component={Link}
          to="/data/data source/tasks"
          variant={
            location.pathname.includes('/data/data source/tasks')
              ? 'contained'
              : 'text'
          }
          size="small"
          color={
            location.pathname.includes('/data/data source/tasks')
              ? 'secondary'
              : 'inherit'
          }
          classes={{ root: classes.button }}
        >
          {t('Data Sources')}
        </Button>
      </div>
    );
  }
}

TopMenuDataTasksEntities.propTypes = {
  classes: PropTypes.object,
  location: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
};

export default compose(
  inject18n,
  withRouter,
  withStyles(styles),
)(TopMenuDataTasksEntities);