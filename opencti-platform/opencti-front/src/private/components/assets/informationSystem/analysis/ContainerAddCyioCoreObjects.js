import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  compose, pipe, map, filter,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import graphql from 'babel-plugin-relay/macro';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import {
  Add, ArrowBack, AddCircleOutline, KeyboardArrowDown,
} from '@material-ui/icons';
import Tooltip from '@material-ui/core/Tooltip';
import Skeleton from '@material-ui/lab/Skeleton';
import { QueryRenderer } from '../../../../../relay/environment';
import inject18n from '../../../../../components/i18n';
import SearchInput from '../../../../../components/SearchInput';
import InformationSystemGraphCreation from '../InformationSystemGraphCreation';
import InformationTypesCreationPopover from '../InformationTypesCreationPopover';
import ContainerAddCyioCoreObjectsLines from './ContainerAddCyioCoreObjectsLines';
import {
  systemImplementationFieldOscalUsersQuery,
  systemImplementationFieldInventoryItemQuery,
  systemImplementationFieldComponentListQuery,
  systemImplementationFieldLeveragedAuthorizationsQuery,
} from '../../../common/form/SystemImplementationField';

const styles = (theme) => ({
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    // backgroundColor: theme.palette.navAlt.background,
    padding: 0,
    zIndex: 1,
  },
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
    zIndex: 1100,
  },
  createButtonExports: {
    position: 'fixed',
    bottom: 30,
    right: 590,
    transition: theme.transitions.create('right', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  createButtonWithPadding: {
    position: 'fixed',
    bottom: 30,
    right: 280,
    zIndex: 1100,
  },
  createButtonSimple: {
    float: 'left',
    marginTop: -15,
  },
  title: {
    float: 'left',
  },
  search: {
    float: 'right',
  },
  header: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    minWidth: '0px',
    padding: '7px',
  },
  container: {
    padding: 0,
    height: '100%',
    width: '100%',
  },
  placeholder: {
    display: 'inline-block',
    height: '1em',
    backgroundColor: theme.palette.grey[700],
  },
  avatar: {
    width: 24,
    height: 24,
  },
  speedDial: {
    position: 'fixed',
    bottom: 30,
    right: 30,
    zIndex: 2000,
  },
  info: {
    paddingTop: 10,
  },
  speedDialButton: {
    backgroundColor: theme.palette.secondary.main,
    color: '#ffffff',
    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
    },
  },
});

const containerAddCyioCoreObjectsInformationTypesQuery = graphql`
  query ContainerAddCyioCoreObjectsInformationTypesQuery(
    $orderedBy: InformationTypeOrdering,
    $orderMode: OrderingMode
  ){
    informationTypes(
      orderedBy: $orderedBy,
      orderMode: $orderMode
    ) {
      pageInfo {
        globalCount
        hasNextPage
      }
      edges {
        node {
          id
          entity_type
          created
          description
          display_name
        }
      }
    }
  }
`;

const containerAddCyioCoreObjectsInformationSystemsQuery = graphql`
  query ContainerAddCyioCoreObjectsInformationSystemsQuery(
    $orderedBy: InformationSystemOrdering,
    $orderMode: OrderingMode
  ){
    informationSystems(
      orderedBy: $orderedBy,
      orderMode: $orderMode
    ) {
      pageInfo {
        globalCount
        hasNextPage
      }
      edges {
        node {
          id
          system_name
          entity_type
          created
          description
        }
      }
    }
  }
`;

class ContainerAddCyioCoreObjects extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      popoverAnchorEl: null,
      openInfoType: false,
      openSpeedDial: false,
      openCreateEntity: false,
      openCreateObservable: false,
      openInfoSystemCreation: false,
      search: '',
    };
  }

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false });
  }

  handleOpenSpeedDial() {
    this.setState({ openSpeedDial: true });
  }

  handleCloseSpeedDial() {
    this.setState({ openSpeedDial: false });
  }

  handleOpenCreateEntity() {
    this.setState({ openCreateEntity: true, openSpeedDial: false });
  }

  handleCloseCreateEntity() {
    this.setState({ openCreateEntity: false, openSpeedDial: false });
  }

  handleOpenCreateObservable() {
    this.setState({ openCreateObservable: true, openSpeedDial: false });
  }

  handleCloseCreateObservable() {
    this.setState({ openCreateObservable: false, openSpeedDial: false });
  }

  handleSearch(keyword) {
    this.setState({ search: keyword });
  }

  handleEntityChange() {
    this.setState({ search: '' });
  }

  handleOpenCreateOnEntity(event) {
    this.setState({ popoverAnchorEl: event.currentTarget });
  }

  handleCloseCreateOnEntity() {
    this.setState({ popoverAnchorEl: null });
  }

  handleInformationSystemCreation() {
    this.setState({ openInfoSystemCreation: !this.state.openInfoSystemCreation });
  }

  handleInfoTypeChange() {
    this.setState({ openInfoType: !this.state.openInfoType });
  }

  renderSearch(name, paginationOptions) {
    const {
      classes,
      containerId,
      containerCyioCoreObjects,
      t,
    } = this.props;
    const { search } = this.state;
    // eslint-disable-next-line no-case-declarations
    let nameQuery = '';
    // eslint-disable-next-line no-case-declarations
    let namePath = [];
    // eslint-disable-next-line no-case-declarations
    const nameArguments = { orderedBy: '', orderMode: '' };

    if (name === 'inventory-item') {
      nameQuery = systemImplementationFieldInventoryItemQuery;
      namePath = ['inventoryItemList', 'edges'];
      nameArguments.orderedBy = 'name';
      nameArguments.orderMode = 'asc';
    }
    if (name === 'component') {
      nameQuery = systemImplementationFieldComponentListQuery;
      namePath = ['componentList', 'edges'];
      nameArguments.orderedBy = 'name';
      nameArguments.orderMode = 'asc';
    }
    if (name === 'oscal-leveraged-authorization') {
      nameQuery = systemImplementationFieldLeveragedAuthorizationsQuery;
      namePath = ['leveragedAuthorizations', 'edges'];
      nameArguments.orderedBy = 'name';
      nameArguments.orderMode = 'desc';
    }
    if (name === 'oscal-user') {
      nameQuery = systemImplementationFieldOscalUsersQuery;
      namePath = ['oscalUsers', 'edges'];
      nameArguments.orderedBy = 'name';
      nameArguments.orderMode = 'asc';
    }
    if (name === 'information-type') {
      nameQuery = containerAddCyioCoreObjectsInformationTypesQuery;
      namePath = ['informationTypes', 'edges'];
      nameArguments.orderedBy = 'name';
      nameArguments.orderMode = 'asc';
    }
    if (name === 'information-system') {
      nameQuery = containerAddCyioCoreObjectsInformationSystemsQuery;
      namePath = ['informationSystems', 'edges'];
      nameArguments.orderedBy = 'name';
      nameArguments.orderMode = 'asc';
    }
    return (
      <QueryRenderer
        query={nameQuery}
        variables={{ orderedBy: nameArguments.orderedBy, orderMode: nameArguments.orderMode }}
        render={({ props }) => {
          if (props && props[namePath[0]]) {
            const cyioCoreObjectsNodes = pipe(
              filter(
                (n) => n.node.entity_type === name,
              ),
              map((n) => n.node),
            )(props[namePath[0]].edges);
            return (
              <ContainerAddCyioCoreObjectsLines
                data={cyioCoreObjectsNodes}
                onAdd={this.props.onAdd}
                containerId={containerId}
                onDelete={this.props.onDelete}
                handleClose={this.handleClose.bind(this)}
                containerCyioCoreObjects={containerCyioCoreObjects}
              />
            );
          }
          return (
            <List>
              {Array.from(Array(2), (e, i) => (
                <ListItem key={i} divider={true} button={false}>
                  <ListItemIcon>
                    <Skeleton
                      animation="wave"
                      variant="circle"
                      width={30}
                      height={30}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Skeleton
                        animation="wave"
                        variant="rect"
                        width="90%"
                        height={15}
                        style={{ marginBottom: 10 }}
                      />
                    }
                    secondary={
                      <Skeleton
                        animation="wave"
                        variant="rect"
                        width="90%"
                        height={15}
                      />
                    }
                  />
                </ListItem>
              ))}
            </List>
          );
        }}
      />
    );
  }

  render() {
    const {
      t,
      classes,
      paginationOptions,
    } = this.props;
    return (
      <div>
        <Tooltip title={t('Add an entity to this container')}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddCircleOutline />}
            onClick={this.handleOpen.bind(this)}
            color='primary'
          >
            {t('New')}
          </Button>
        </Tooltip>
        <Drawer
          open={this.state.open}
          hideBackdrop={true}
          anchor='right'
          classes={{ paper: classes.drawerPaper }}
          onClose={this.handleClose.bind(this)}
        >
          <div className={classes.header}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size='small'
                variant='outlined'
                className={classes.closeButton}
                onClick={this.handleClose.bind(this)}
              >
                <ArrowBack />
              </Button>
              <Typography style={{ marginLeft: '20px' }}>
                {t('Add Entities')}
              </Typography>
            </div>
            <SearchInput
              disabled
              variant='noAnimation'
              placeholder={`${t('Search')}...`}
              onSubmit={this.handleSearch.bind(this)}
            />
          </div>
          {this.renderSearch('component', paginationOptions)}
          {this.renderSearch('inventory-item', paginationOptions)}
          {this.renderSearch('oscal-leveraged-authorization', paginationOptions)}
          {this.renderSearch('oscal-user', paginationOptions)}
          {this.renderSearch('information-type', paginationOptions)}
          {this.renderSearch('information-system', paginationOptions)}
          <div style={{
            position: 'absolute', bottom: '0px', right: '0px', padding: '20px 5px', height: '180px',
          }}>
            <Button
              size='small'
              color='primary'
              variant='contained'
              className={classes.closeButton}
              style={{ marginRight: '10px' }}
              startIcon={<Add fontSize='small' />}
              endIcon={<KeyboardArrowDown fontSize='small' />}
              onClick={this.handleOpenCreateOnEntity.bind(this)}
            >
              {t('Create an Entity')}
            </Button>
            <Menu
              style={{ marginTop: 50 }}
              anchorEl={this.state.popoverAnchorEl}
              open={Boolean(this.state.popoverAnchorEl)}
              onClose={this.handleCloseCreateOnEntity.bind(this)}
            >
              <MenuItem onClick={this.handleInformationSystemCreation.bind(this)}>
                {t('Create an Information System')}
              </MenuItem>
              <MenuItem disabled onClick={this.handleInfoTypeChange.bind(this)}>
                {t('Create an Information Type')}
              </MenuItem>
            </Menu>
          </div>
        </Drawer>
        <InformationSystemGraphCreation
          InfoSystemCreation={this.state.openInfoSystemCreation}
          handleInformationSystemCreation={this.handleInformationSystemCreation.bind(this)}
        />
        <InformationTypesCreationPopover
          open={this.state.openInfoType}
          handleChangeDialog={this.handleInfoTypeChange.bind(this)}
        />
      </div>
    );
  }
}

ContainerAddCyioCoreObjects.propTypes = {
  containerId: PropTypes.string,
  classes: PropTypes.object,
  t: PropTypes.func,
  fld: PropTypes.func,
  paginationOptions: PropTypes.object,
  containerCyioCoreObjects: PropTypes.array,
  targetCyioCoreObjectTypes: PropTypes.array,
  onTypesChange: PropTypes.func,
  onAdd: PropTypes.func,
  onDelete: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles),
)(ContainerAddCyioCoreObjects);
