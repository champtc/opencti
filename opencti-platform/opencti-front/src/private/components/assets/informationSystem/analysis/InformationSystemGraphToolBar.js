import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { withTheme, withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import {
  AspectRatio,
  FilterListOutlined,
  AccountBalanceOutlined,
  DeleteOutlined,
  LinkOutlined,
  CenterFocusStrongOutlined,
  EditOutlined,
  Visibility,
  ScatterPlotOutlined,
  DateRangeOutlined,
} from '@material-ui/icons';
import {
  Video3d,
  SelectAll,
  SelectGroup,
  FamilyTree,
  AutoFix,
} from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Drawer from '@material-ui/core/Drawer';
import Popover from '@material-ui/core/Popover';
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Slide from '@material-ui/core/Slide';
import inject18n from '../../../../../components/i18n';
import { truncate } from '../../../../../utils/String';
import SearchInput from '../../../../../components/SearchInput';
import ContainerAddCyioCoreObjects from './ContainerAddCyioCoreObjects';
import CyioCoreRelationshipCreation from './CyioCoreRelationshipCreation';
import InformationTypeEdition, {
  InformationTypeEditionQuery,
} from '../InformationTypeEdition';
import { QueryRenderer } from '../../../../../relay/environment';

const styles = (theme) => ({
  bottomNav: {
    zIndex: 1000,
    display: 'flex',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  divider: {
    display: 'inline-block',
    verticalAlign: 'middle',
    height: '100%',
    margin: '0 5px 0 5px',
  },
  iconButton: {
    minWidth: '0px',
    marginRight: 15,
    padding: '7px',
  },
});

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

class InformationSystemGraphToolBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openCyioCoreObjectsTypes: false,
      anchorElCyioCoreObjectsTypes: null,
      openMarkedBy: false,
      anchorElMarkedBy: null,
      openCreatedBy: false,
      anchorElCreatedBy: null,
      openSelectByType: false,
      anchorElSelectByType: null,
      openCreatedRelation: false,
      relationReversed: false,
      openEditRelation: false,
      openEditEntity: false,
      displayRemove: false,
    };
  }

  handleOpenRemove() {
    this.setState({ displayRemove: true });
  }

  handleCloseRemove() {
    this.setState({ displayRemove: false });
  }

  handleOpenCyioCoreObjectsTypes(event) {
    this.setState({
      openCyioCoreObjectsTypes: true,
      anchorElCyioCoreObjectsTypes: event.currentTarget,
    });
  }

  handleCloseCyioCoreObjectsTypes() {
    this.setState({
      openCyioCoreObjectsTypes: false,
      anchorElCyioCoreObjectsTypes: null,
    });
  }

  handleOpenCreatedBy(event) {
    this.setState({
      openCreatedBy: true,
      anchorElCreatedBy: event.currentTarget,
    });
  }

  handleCloseCreatedBy() {
    this.setState({ openCreatedBy: false, anchorElCreatedBy: null });
  }

  handleOpenMarkedBy(event) {
    this.setState({
      openMarkedBy: true,
      anchorElMarkedBy: event.currentTarget,
    });
  }

  handleOpenSelectByType(event) {
    this.setState({
      openSelectByType: true,
      anchorElSelectByType: event.currentTarget,
    });
  }

  handleCloseSelectByType() {
    this.setState({
      openSelectByType: false,
      anchorElSelectByType: null,
    });
  }

  handleCloseMarkedBy() {
    this.setState({ openMarkedBy: false, anchorElMarkedBy: null });
  }

  handleOpenCreateRelationship() {
    this.setState({ openCreatedRelation: true });
  }

  handleCloseCreateRelationship() {
    this.setState({ openCreatedRelation: false });
  }

  handleReverseRelation() {
    this.setState({ relationReversed: !this.state.relationReversed });
  }

  handleOpenEditItem() {
    if (
      this.props.numberOfSelectedNodes === 1
      && !this.props.selectedNodes[0].relationship_type
      && this.props.selectedNodes[0].entity_type === 'information-type'
    ) {
      this.setState({ openEditEntity: true });
    } else if (
      this.props.numberOfSelectedLinks === 1
      || this.props.selectedNodes[0].relationship_type
    ) {
      this.setState({ openEditRelation: true });
    }
  }

  handleCloseEditEntity() {
    this.setState({ openEditEntity: false });
  }

  handleSelectByType(type) {
    this.props.handleSelectByType(type);
    this.handleCloseSelectByType();
  }

  render() {
    const {
      t,
      classes,
      currentMode3D,
      currentModeTree,
      currentModeFixed,
      currentCreatedBy,
      currentMarkedBy,
      currentCyioCoreObjectsTypes,
      handleToggle3DMode,
      handleToggleTreeMode,
      handleToggleFixedMode,
      handleToggleCreatedBy,
      handleToggleMarkedBy,
      handleToggleCyioCoreObjectType,
      handleZoomToFit,
      cyioCoreObjectsTypes,
      createdBy,
      markedBy,
      informationSystem,
      graphData,
      onAdd,
      onDelete,
      handleDeleteSelected,
      numberOfSelectedNodes,
      numberOfSelectedLinks,
      selectedNodes,
      selectedLinks,
      lastLinkFirstSeen,
      lastLinkLastSeen,
      onAddRelation,
      handleSelectAll,
      handleResetLayout,
      displayTimeRange,
      timeRangeInterval,
      selectedTimeRangeInterval,
      handleToggleDisplayTimeRange,
      handleTimeRangeChange,
      timeRangeValues,
      theme,
      overview,
      leftBarOpen,
    } = this.props;
    const {
      openCyioCoreObjectsTypes,
      anchorElCyioCoreObjectsTypes,
      openMarkedBy,
      anchorElMarkedBy,
      openCreatedBy,
      anchorElCreatedBy,
      openSelectByType,
      anchorElSelectByType,
      openCreatedRelation,
      relationReversed,
      openEditEntity,
    } = this.state;
    const editionEnabled = (selectedNodes.length
      && selectedNodes[0].entity_type === 'information-type')
      && ((numberOfSelectedNodes === 1
        && numberOfSelectedLinks === 0)
        || (numberOfSelectedNodes === 0 && numberOfSelectedLinks === 1));
    const fromSelectedTypes = numberOfSelectedNodes >= 2
      ? R.uniq(R.map((n) => n.entity_type, R.init(selectedNodes)))
      : [];
    const toSelectedTypes = numberOfSelectedNodes >= 2
      ? R.uniq(R.map((n) => n.entity_type, R.tail(selectedNodes)))
      : [];
    let relationFromObjects = null;
    let relationToObjects = null;
    if (fromSelectedTypes.length === 1 && numberOfSelectedLinks === 0) {
      relationFromObjects = relationReversed
        ? [R.last(selectedNodes)]
        : R.init(selectedNodes);
      relationToObjects = relationReversed
        ? R.init(selectedNodes)
        : [R.last(selectedNodes)];
    } else if (toSelectedTypes.length === 1 && numberOfSelectedLinks === 0) {
      relationFromObjects = relationReversed
        ? R.tail(selectedNodes)
        : [R.head(selectedNodes)];
      relationToObjects = relationReversed
        ? [R.head(selectedNodes)]
        : R.tail(selectedNodes);
    } else if (numberOfSelectedNodes === 1 && numberOfSelectedLinks === 1) {
      relationFromObjects = relationReversed
        ? [selectedNodes[0]]
        : [selectedLinks[0]];
      relationToObjects = relationReversed
        ? [selectedLinks[0]]
        : [selectedNodes[0]];
    }
    return (
      <Drawer
        anchor="bottom"
        variant="permanent"
        classes={{ paper: classes.bottomNav }}
        PaperProps={{
          variant: 'elevation',
          elevation: 1,
        }}
      >
        <div
          style={{
            verticalAlign: 'top',
            transition: 'height 0.2s linear',
            height: displayTimeRange ? 134 : 54,
          }}
        >
          <div
            style={{
              height: 54,
              padding: '3px 15px 0px 0px',
              display: 'flex',
              verticalAlign: 'top',
              justifyContent: 'space-between',
              marginLeft: (overview && leftBarOpen) ? 260 : 0,
            }}
          >
            <div
              style={{
                height: '100%',
                display: 'flex',
              }}
            >
              <Tooltip
                title={
                  currentMode3D ? t('Disable 3D mode') : t('Enable 3D mode')
                }
              >
                <span>
                  <IconButton
                    color={currentMode3D ? 'secondary' : 'primary'}
                    onClick={handleToggle3DMode.bind(this)}
                  >
                    <Video3d />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  currentModeTree
                    ? t('Disable vertical tree mode')
                    : t('Enable vertical tree mode')
                }
              >
                <span>
                  <IconButton
                    color={
                      currentModeTree === 'vertical' ? 'secondary' : 'primary'
                    }
                    onClick={handleToggleTreeMode.bind(this, 'vertical')}
                    disabled={currentModeFixed}
                  >
                    <FamilyTree />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  currentModeTree
                    ? t('Disable horizontal tree mode')
                    : t('Enable horizontal tree mode')
                }
              >
                <span>
                  <IconButton
                    color={
                      currentModeTree === 'horizontal' ? 'secondary' : 'primary'
                    }
                    onClick={handleToggleTreeMode.bind(this, 'horizontal')}
                    disabled={currentModeFixed}
                  >
                    <FamilyTree style={{ transform: 'rotate(-90deg)' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  currentModeFixed ? t('Enable forces') : t('Disable forces')
                }
              >
                <span>
                  <IconButton
                    color={currentModeFixed ? 'primary' : 'secondary'}
                    onClick={handleToggleFixedMode.bind(this)}
                  >
                    <ScatterPlotOutlined />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t('Fit graph to canvas')}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={handleZoomToFit.bind(this)}
                  >
                    <AspectRatio />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t('Unfix the nodes and re-apply forces')}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={handleResetLayout.bind(this)}
                    disabled={currentModeFixed}
                  >
                    <AutoFix />
                  </IconButton>
                </span>
              </Tooltip>
              <Divider className={classes.divider} orientation="vertical" />
              <Tooltip title={t('Select by entity type')}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={this.handleOpenSelectByType.bind(this)}
                  >
                    <SelectGroup />
                  </IconButton>
                </span>
              </Tooltip>
              <Popover
                classes={{ paper: classes.container }}
                open={openSelectByType}
                anchorEl={anchorElSelectByType}
                onClose={this.handleCloseSelectByType.bind(this)}
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
                  {cyioCoreObjectsTypes.map((cyioCoreObjectType) => (
                    <ListItem
                      key={cyioCoreObjectType}
                      role={undefined}
                      dense={true}
                      button={true}
                      onClick={this.handleSelectByType.bind(
                        this,
                        cyioCoreObjectType,
                      )}
                    >
                      <ListItemText
                        primary={t(`entity_${cyioCoreObjectType}`)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Popover>
              <Tooltip title={t('Select all nodes')}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={handleSelectAll.bind(this)}
                  >
                    <SelectAll />
                  </IconButton>
                </span>
              </Tooltip>
              <Divider className={classes.divider} orientation="vertical" />
              <Tooltip title={t('Display time range selector')}>
                <span>
                  <IconButton
                    color={displayTimeRange ? 'secondary' : 'primary'}
                    onClick={handleToggleDisplayTimeRange.bind(this)}
                  >
                    <DateRangeOutlined />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t('Filter entity types')}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={this.handleOpenCyioCoreObjectsTypes.bind(this)}
                  >
                    <FilterListOutlined />
                  </IconButton>
                </span>
              </Tooltip>
              <Popover
                classes={{ paper: classes.container }}
                open={openCyioCoreObjectsTypes}
                anchorEl={anchorElCyioCoreObjectsTypes}
                onClose={this.handleCloseCyioCoreObjectsTypes.bind(this)}
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
                  {cyioCoreObjectsTypes.map((cyioCoreObjectType) => (
                    <ListItem
                      key={cyioCoreObjectType}
                      role={undefined}
                      dense={true}
                      button={true}
                      onClick={handleToggleCyioCoreObjectType.bind(
                        this,
                        cyioCoreObjectType,
                      )}
                    >
                      <ListItemIcon style={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={currentCyioCoreObjectsTypes.includes(
                            cyioCoreObjectType,
                          )}
                          disableRipple={true}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={t(`entity_${cyioCoreObjectType}`)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Popover>
              <Tooltip title={t('Filter marking definitions')}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={this.handleOpenMarkedBy.bind(this)}
                  >
                    <CenterFocusStrongOutlined />
                  </IconButton>
                </span>
              </Tooltip>
              <Popover
                classes={{ paper: classes.container }}
                open={openMarkedBy}
                anchorEl={anchorElMarkedBy}
                onClose={this.handleCloseMarkedBy.bind(this)}
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
                  {markedBy.map((markingDefinition) => (
                    <ListItem
                      key={markingDefinition.id}
                      role={undefined}
                      dense={true}
                      button={true}
                      onClick={handleToggleMarkedBy.bind(
                        this,
                        markingDefinition.id,
                      )}
                    >
                      <ListItemIcon style={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={currentMarkedBy.includes(
                            markingDefinition.id,
                          )}
                          disableRipple={true}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={truncate(markingDefinition.definition, 20)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Popover>
              <Tooltip title={t('Filter authors (created by)')}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={this.handleOpenCreatedBy.bind(this)}
                  >
                    <AccountBalanceOutlined />
                  </IconButton>
                </span>
              </Tooltip>
              <Popover
                classes={{ paper: classes.container }}
                open={openCreatedBy}
                anchorEl={anchorElCreatedBy}
                onClose={this.handleCloseCreatedBy.bind(this)}
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
                  {createdBy.map((createdByRef) => (
                    <ListItem
                      key={createdBy.id}
                      role={undefined}
                      dense={true}
                      button={true}
                      onClick={handleToggleCreatedBy.bind(
                        this,
                        createdByRef.id,
                      )}
                    >
                      <ListItemIcon style={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={currentCreatedBy.includes(createdByRef.id)}
                          disableRipple={true}
                        />
                      </ListItemIcon>
                      <ListItemText primary={createdByRef.name} />
                    </ListItem>
                  ))}
                </List>
              </Popover>
              <Divider className={classes.divider} orientation="vertical" />
              <div style={{ margin: '9px 0 0 10px' }}>
                <SearchInput
                  variant='noAnimation'
                // onSubmit={this.props.handleSearch.bind(this)}
                />
              </div>
            </div>
            {(informationSystem && !overview) && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Tooltip title={t('Edit the selected item')}>
                  <span>
                    <Button
                      size='small'
                      variant='contained'
                      color='primary'
                      className={classes.iconButton}
                      onClick={this.handleOpenEditItem.bind(this)}
                      disabled={!editionEnabled}
                    >
                      <EditOutlined />
                    </Button>
                  </span>
                </Tooltip>
                {openEditEntity && (
                  <QueryRenderer
                    query={InformationTypeEditionQuery}
                    variables={{ id: selectedNodes[0].id }}
                    render={({ props }) => {
                      if (props) {
                        return (
                          <InformationTypeEdition
                            openEdit={openEditEntity}
                            data={props}
                            handleEditInfoType={this.handleCloseEditEntity.bind(this)}
                          />
                        );
                      }
                      return (
                        <div style={{ height: '100%' }}>
                        </div>
                      );
                    }}
                  />
                )}
                {handleDeleteSelected && (
                  <Tooltip title={t('Remove selected items')}>
                    <span>
                      <Button
                        size='small'
                        color='primary'
                        variant='contained'
                        className={classes.iconButton}
                        onClick={this.handleOpenRemove.bind(this)}
                        disabled={!editionEnabled}
                      >
                        <DeleteOutlined />
                      </Button>
                    </span>
                  </Tooltip>
                )}
                {onAddRelation && (
                  <Tooltip title={t('Create a relationship')}>
                    <span>
                      <Button
                        size='small'
                        color='primary'
                        disabled={true}
                        variant='contained'
                        className={classes.iconButton}
                        onClick={this.handleOpenCreateRelationship.bind(this)}
                      // disabled={!relationEnabled}
                      >
                        <LinkOutlined />
                      </Button>
                    </span>
                  </Tooltip>
                )}
                <CyioCoreRelationshipCreation
                  open={openCreatedRelation}
                  handleClose={this.handleCloseCreateRelationship.bind(this)}
                />
                <Tooltip title={t('Create a sighting')}>
                  <span>
                    <Button
                      size='small'
                      color='primary'
                      // component={Link}
                      target='_blank'
                      variant='contained'
                      className={classes.iconButton}
                      // to={viewLink}
                      disabled
                    // disabled={!viewEnabled}
                    >
                      <Visibility />
                    </Button>
                  </span>
                </Tooltip>
                {onAdd && (
                  <ContainerAddCyioCoreObjects
                    containerId={informationSystem.id}
                    containerCyioCoreObjects={graphData}
                    knowledgeGraph={true}
                    defaultCreatedBy={R.propOr(null, 'createdBy', informationSystem)}
                    defaultMarkingDefinitions={R.map(
                      (n) => n.node,
                      R.pathOr([], ['objects', 'edges'], informationSystem),
                    )}
                    onAdd={onAdd}
                    onDelete={onDelete}
                  />
                )}
                <Dialog
                  open={this.state.displayRemove}
                  keepMounted={true}
                  TransitionComponent={Transition}
                  onClose={this.handleCloseRemove.bind(this)}
                >
                  <DialogContent>
                    <DialogContentText>
                      {t(
                        'Do you want to remove these elements from this report?',
                      )}
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={this.handleCloseRemove.bind(this)}>
                      {t('Cancel')}
                    </Button>
                    <Button
                      onClick={() => {
                        this.handleCloseRemove();
                        handleDeleteSelected();
                      }}
                      color="primary"
                    >
                      {t('Remove')}
                    </Button>
                  </DialogActions>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    );
  }
}

InformationSystemGraphToolBar.propTypes = {
  classes: PropTypes.object,
  overview: PropTypes.bool,
  t: PropTypes.func,
  leftBarOpen: PropTypes.bool,
  informationSystem: PropTypes.object,
  handleToggle3DMode: PropTypes.func,
  currentMode3D: PropTypes.bool,
  handleToggleTreeMode: PropTypes.func,
  currentModeTree: PropTypes.string,
  currentModeFixed: PropTypes.bool,
  handleToggleFixedMode: PropTypes.func,
  handleZoomToFit: PropTypes.func,
  handleToggleCyioCoreObjectType: PropTypes.func,
  cyioCoreObjectsTypes: PropTypes.array,
  currentCyioCoreObjectsTypes: PropTypes.array,
  handleToggleMarkedBy: PropTypes.func,
  markedBy: PropTypes.array,
  currentMarkedBy: PropTypes.array,
  handleToggleCreatedBy: PropTypes.func,
  createdBy: PropTypes.array,
  currentCreatedBy: PropTypes.array,
  selectedNodes: PropTypes.array,
  selectedLinks: PropTypes.array,
  numberOfSelectedNodes: PropTypes.number,
  numberOfSelectedLinks: PropTypes.number,
  onAdd: PropTypes.func,
  onDelete: PropTypes.func,
  onAddRelation: PropTypes.func,
  handleDeleteSelected: PropTypes.func,
  lastLinkFirstSeen: PropTypes.string,
  lastLinkLastSeen: PropTypes.string,
  handleSelectAll: PropTypes.func,
  graphData: PropTypes.graphData,
  handleSelectByType: PropTypes.func,
  handleResetLayout: PropTypes.func,
  displayTimeRange: PropTypes.bool,
  handleToggleDisplayTimeRange: PropTypes.func,
  handleTimeRangeChange: PropTypes.func,
  timeRangeInterval: PropTypes.array,
  selectedTimeRangeInterval: PropTypes.array,
  timeRangeValues: PropTypes.array,
  theme: PropTypes.object,
};

export default R.compose(
  inject18n,
  withTheme,
  withStyles(styles),
)(InformationSystemGraphToolBar);
