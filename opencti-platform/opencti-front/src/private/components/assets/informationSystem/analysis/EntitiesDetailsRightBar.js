import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import graphql from 'babel-plugin-relay/macro';
import {
  compose,
  pathOr,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import { Information } from 'mdi-material-ui';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import IconButton from '@material-ui/core/IconButton';
import { OpenInNewOutlined } from '@material-ui/icons';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { fetchQuery } from '../../../../../relay/environment';
import inject18n from '../../../../../components/i18n';

const styles = (theme) => ({
  drawerPaper: {
    position: 'fixed',
    top: '50%',
    right: 20,
    transform: 'translateY(-50%)',
    width: 400,
    maxWidth: 400,
    height: '60%',
    maxHeight: '60%',
    padding: '40px 20px 20px 20px',
    zIndex: 999,
  },
  textBase: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 5,
  },
  external: {
    paddingLeft: 10,
  },
});

const entitiesDetailsRightBarInventoryItemQuery = graphql`
  query EntitiesDetailsRightBarInventoryItemQuery($id: ID!){
    inventoryItem(id: $id) {
      id
      name
      created
      description
      object_markings {
        ... on IEPMarking {
          color
          name
        }
      }
    }
  }
`;

const entitiesDetailsRightBarComponentQuery = graphql`
  query EntitiesDetailsRightBarComponentQuery($id: ID!){
    component(id: $id) {
      id
      name
      created
      description
      object_markings {
        ... on IEPMarking {
          color
          name
        }
      }
    }
  }
`;

const entitiesDetailsRightBarLeveragedAuthorizationQuery = graphql`
  query EntitiesDetailsRightBarLeveragedAuthorizationQuery($id: ID!){
    leveragedAuthorization(id: $id) {
      id
      title
      created
      description
      object_markings {
        ... on IEPMarking {
          color
          name
        }
      }
    }
  }
`;

const entitiesDetailsRightBarOscalUserQuery = graphql`
  query EntitiesDetailsRightBarOscalUserQuery($id: ID!){
    oscalUser(id: $id) {
      id
      name
      created
      description
      object_markings {
        ... on IEPMarking {
          color
          name
        }
      }
    }
  }
`;

const entitiesDetailsRightBarInformationSystemQuery = graphql`
  query EntitiesDetailsRightBarInformationSystemQuery($id: ID!){
    informationSystem(id: $id) {
      id
      created
      system_name
      description
      object_markings {
        ... on IEPMarking {
          color
          name
        }
      }
    }
  }
`;

const entitiesDetailsRightBarInformationTypeQuery = graphql`
  query EntitiesDetailsRightBarInformationTypeQuery($id: ID!){
    informationType(id: $id) {
      id
      created
      display_name
      description
      object_markings {
        ... on IEPMarking {
          color
          name
        }
      }
    }
  }
`;

class EntitiesDetailsRightBarContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedPanels: {},
      addedCyioCoreObjects: [],
      entityData: {},
    };
  }

  componentDidMount() {
    const { selectedEntity } = this.props;
    let nameQuery = '';
    // eslint-disable-next-line no-case-declarations
    let namePath = '';
    if (selectedEntity.entity_type === 'inventory-item') {
      nameQuery = entitiesDetailsRightBarInventoryItemQuery;
      namePath = 'inventoryItem';
    }
    if (selectedEntity.entity_type === 'component') {
      nameQuery = entitiesDetailsRightBarComponentQuery;
      namePath = 'component';
    }
    if (selectedEntity.entity_type === 'oscal-leveraged-authorization') {
      nameQuery = entitiesDetailsRightBarLeveragedAuthorizationQuery;
      namePath = 'leveragedAuthorization';
    }
    if (selectedEntity.entity_type === 'oscal-user') {
      nameQuery = entitiesDetailsRightBarOscalUserQuery;
      namePath = 'oscalUser';
    }
    if (selectedEntity.entity_type === 'information-type') {
      nameQuery = entitiesDetailsRightBarInformationTypeQuery;
      namePath = 'informationType';
    }
    if (selectedEntity.entity_type === 'information-system') {
      nameQuery = entitiesDetailsRightBarInformationSystemQuery;
      namePath = 'informationSystem';
    }
    fetchQuery(nameQuery, {
      id: this.props.selectedEntity.id,
    })
      .toPromise()
      .then((data) => {
        const ExportTypeEntities = pathOr({}, [namePath], data);
        this.setState({ entityData: ExportTypeEntities });
      });
  }

  render() {
    const {
      t, classes, data, fd, theme, navOpen, handleChangeNav,
    } = this.props;
    const {
      entityData,
    } = this.state;
    return (
      <Drawer
        open={navOpen}
        anchor="right"
        variant="permanent"
        hideBackdrop={true}
        PaperProps={{ variant: 'outlined' }}
        classes={{ paper: classes.drawerPaper }}
        onClose={() => handleChangeNav()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Select
            labelId="dashboard"
            fullWidth={true}
            variant='outlined'
            // onChange={handleSelectEntity}
            value={this.props.selectedEntity.id}
            style={{ height: '60px' }}
            containerstyle={{ width: '100%' }}
          >
            {/* {uniqSelectedEntities.map((entity) => ( */}
            <MenuItem value={entityData.id}>
              {entityData.name && t(entityData.name)}
              {entityData.system_name && t(entityData.system_name)}
              {entityData.title && t(entityData.title)}
              {entityData.display_name && t(entityData.display_name)}
            </MenuItem>
            {/* ))} */}
          </Select>
          <div className={classes.external}>
            <IconButton
              // component={Link}
              target="_blank"
              // to={`/dashboard/id/${selectedEntity.id}`}
              size="medium"
            >
              <OpenInNewOutlined fontSize="medium" />
            </IconButton>
          </div>
        </div>
        <div className="clearfix" />
        <Grid container spacing={2} style={{ marginTop: '20px' }}>
          <Grid item xs={12}>
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
                  'Name',
                )}
              >
                <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
              </Tooltip>
            </div>
            <div className="clearfix" />
            {entityData.name && t(entityData.name)}
            {entityData.system_name && t(entityData.system_name)}
            {entityData.title && t(entityData.title)}
            {entityData.display_name && t(entityData.display_name)}
          </Grid>
          <Grid item xs={12}>
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
                  'Description',
                )}
              >
                <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
              </Tooltip>
            </div>
            <div className="clearfix" />
            <Markdown
              className="markdown"
              remarkPlugins={[remarkGfm, remarkParse]}
              parserOptions={{ commonmark: true }}
            >
              {entityData.description && t(entityData.description)}
            </Markdown>
          </Grid>
          <Grid item xs={12}>
            <div className={classes.textBase}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ margin: 0 }}
              >
                {t('Creation Date')}
              </Typography>
              <Tooltip
                title={t(
                  'Creation Date',
                )}
              >
                <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
              </Tooltip>
            </div>
            <div className="clearfix" />
            {entityData.created && fd(entityData.created)}
          </Grid>
          <Grid item xs={12}>
            <div className={classes.textBase}>
              <Typography
                variant="h3"
                color="textSecondary"
                gutterBottom={true}
                style={{ margin: 0 }}
              >
                {t('Marking')}
              </Typography>
              <Tooltip
                title={t(
                  'Marking',
                )}
              >
                <Information style={{ marginLeft: '5px' }} fontSize="inherit" color="disabled" />
              </Tooltip>
            </div>
            <div className="clearfix" />
            {/* {entityData.object_markings.length && t(entityData.object_markings[0].name)} */}
          </Grid>
        </Grid>
      </Drawer>
    );
  }
}

EntitiesDetailsRightBarContainer.propTypes = {
  containerId: PropTypes.string,
  data: PropTypes.object,
  limit: PropTypes.number,
  classes: PropTypes.object,
  t: PropTypes.func,
  fd: PropTypes.func,
  selectedEntity: PropTypes.object,
  handleChangeNav: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles),
)(EntitiesDetailsRightBarContainer);
