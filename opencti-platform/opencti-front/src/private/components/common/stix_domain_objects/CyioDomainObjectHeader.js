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
  Edit,
  ArrowBack,
  AddCircleOutline,
} from '@material-ui/icons';
import Popover from '@material-ui/core/Popover';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import inject18n from '../../../../components/i18n';
import InfoGraphImg from '../../../../resources/images/entities/information_graph.svg';
import ItemIcon from '../../../../components/ItemIcon';

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
  popover: {
    float: 'left',
    marginTop: '-13px',
  },
  aliases: {
    display: 'flex',
    float: 'right',
    marginTop: '-5px',
  },
  alias: {
    marginRight: 7,
  },
  aliasesInput: {
    margin: '4px 15px 0 10px',
    float: 'right',
  },
  viewAsField: {
    marginTop: -5,
    float: 'left',
  },
  viewAsFieldLabel: {
    margin: '5px 15px 0 0',
    fontSize: 14,
    float: 'left',
  },
  informationSystemIcon: {
    minWidth: '26px',
  },
  informationSystemText: {
    marginLeft: '10px',
  },
});

class CyioDomainObjectAssetHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      openAlias: false,
      openAliases: false,
      openAliasesCreate: false,
      openInfoPopover: false,
    };
  }

  handleInfoNewCreation(event) {
    this.setState({ openInfoPopover: true, anchorEl: event.currentTarget });
  }

  handleCloseInfoNewCreation() {
    this.setState({ openInfoPopover: false, anchorEl: null });
  }

  handleInfoSystemListItem(type) {
    this.props.handleOpenNewCreation(type);
    this.handleCloseInfoNewCreation();
  }

  render() {
    const {
      t,
      name,
      goBack,
      classes,
      history,
      disabled,
      disablePopover,
      cyioDomainObject,
      handleCreateGraph,
      handleDisplayEdit,
      OperationsComponent,
      handleOpenNewCreation,
    } = this.props;
    return (
      <div className={classes.header}>
        <Tooltip title={t('Back')} style={{ marginTop: -5 }}>
          <Button variant="outlined" className={classes.iconButton} size="large" onClick={() => history.push(goBack)}>
            <ArrowBack fontSize="inherit" />
          </Button>
        </Tooltip>
        <Typography
          variant="h1"
          gutterBottom={true}
          classes={{ root: classes.title }}
        >
          {name}
        </Typography>
        <div className={classes.aliases}>
          {/* <Security needs={[KNOWLEDGE_KNUPDATE]}> */}
          {goBack === '/defender_hq/assets/information_systems' && (
            <Tooltip title={t('Graph')}>
              <Button
                size="large"
                color="primary"
                variant="contained"
                className={classes.iconButton}
                onClick={handleCreateGraph?.bind(this)}
              >
                <img src={InfoGraphImg} alt='' />
              </Button>
            </Tooltip>
          )}
          {handleDisplayEdit && <Tooltip title={t('Edit')}>
            <Button
              variant="contained"
              onClick={handleDisplayEdit?.bind(this)}
              className={classes.iconButton}
              disabled={Boolean(!cyioDomainObject?.id) || Boolean(goBack === '/data/entities/information_types') || disabled}
              color="primary"
              size="large"
            >
              <Edit fontSize="inherit" />
            </Button>
          </Tooltip>}
          <div style={{ display: 'inline-block' }}>
            {OperationsComponent && React.cloneElement(OperationsComponent, {
              id: [cyioDomainObject?.id],
              disabled: disablePopover,
            })}
          </div>
          {goBack === '/defender_hq/assets/information_systems' ? (
            <>
              <Button
                variant="contained"
                size="small"
                ref={this.state.anchorEl}
                startIcon={<AddCircleOutline />}
                onClick={this.handleInfoNewCreation.bind(this)}
                color='primary'
                disabled={disabled || false}
              >
                {t('New')}
              </Button>
              <Popover
                id='simple-popover'
                anchorEl={this.state.anchorEl}
                open={this.state.openInfoPopover}
                onClose={this.handleCloseInfoNewCreation.bind(this)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
              >
                <List>
                  <ListItem
                    button={true}
                    onClick={this.handleInfoSystemListItem.bind(this, 'graph')}
                  >
                    <ListItemIcon className={classes.informationSystemIcon}>
                      <ItemIcon type='InformationSystemGraph' />
                    </ListItemIcon>
                    <ListItemText primary='Graph' className={classes.informationSystemText} />
                  </ListItem>
                  <ListItem
                    button={true}
                    onClick={this.handleInfoSystemListItem.bind(this, 'form')}
                  >
                    <ListItemIcon className={classes.informationSystemIcon}>
                      <ItemIcon type='InformationSystemForm' />
                    </ListItemIcon>
                    <ListItemText primary='Form' className={classes.informationSystemText} />
                  </ListItem>
                </List>
              </Popover>
            </>
          ) : (
            <Tooltip title={t('Create New')}>
              <Button
                variant="contained"
                size="small"
                onClick={handleOpenNewCreation && handleOpenNewCreation.bind(this)}
                startIcon={<AddCircleOutline />}
                disabled={disabled || !handleOpenNewCreation || false}
                color='primary'
              >
                {t('New')}
              </Button>
            </Tooltip>
          )
          }
          {/* </Security> */}
        </div>
      </div>
    );
  }
}

CyioDomainObjectAssetHeader.propTypes = {
  cyioDomainObject: PropTypes.object,
  PopoverComponent: PropTypes.object,
  handleCreateGraph: PropTypes.func,
  name: PropTypes.string,
  variant: PropTypes.string,
  classes: PropTypes.object,
  goBack: PropTypes.string,
  t: PropTypes.func,
  disabled: PropTypes.bool,
  fld: PropTypes.func,
  viewAs: PropTypes.string,
  onViewAs: PropTypes.func,
  disablePopover: PropTypes.bool,
  isOpenctiAlias: PropTypes.bool,
};

export default compose(inject18n, withStyles(styles))(CyioDomainObjectAssetHeader);
