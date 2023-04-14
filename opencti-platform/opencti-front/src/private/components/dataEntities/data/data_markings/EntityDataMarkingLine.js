import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { Link } from 'react-router-dom';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import Skeleton from '@material-ui/lab/Skeleton';
import inject18n from '../../../../../components/i18n';
import EntitiesDataMarkingsPopover from './EntitiesDataMarkingsPopover';
import { truncate } from '../../../../../utils/String';

const styles = (theme) => ({
  item: {
    '&.Mui-selected, &.Mui-selected:hover': {
      background: theme.palette.dataView.selectedBackgroundColor,
      borderTop: `0.75px solid ${theme.palette.dataView.selectedBorder}`,
      borderBottom: `0.75px solid ${theme.palette.dataView.selectedBorder}`,
    },
    paddingLeft: 10,
    height: 50,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    paddingLeft: 24,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  goIcon: {
    minWidth: '0px',
  },
  itemIconDisabled: {
    color: theme.palette.grey[700],
  },
  placeholder: {
    display: 'inline-block',
    height: '1em',
    backgroundColor: theme.palette.grey[700],
  },
});

class EntityDataMarkingLineComponent extends Component {
  render() {
    const {
      t,
      fldt,
      classes,
      history,
      node,
      selectAll,
      dataColumns,
      onToggleEntity,
      selectedElements,
    } = this.props;
    return (
      <ListItem
        classes={{ root: classes.item }}
        divider={true}
        button={true}
        component={Link}
        selected={selectAll || node.id in (selectedElements || {})}
        to={`/data/entities/data_markings/${node.id}`}
      >
        <ListItemIcon
          classes={{ root: classes.itemIcon }}
          style={{ minWidth: 38 }}
          onClick={onToggleEntity.bind(this, node)}
        >
          <Checkbox
            edge="start"
            color="primary"
            checked={selectAll || node.id in (selectedElements || {})}
            disableRipple={true}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.type.width }}
              >
                {node.definition_type && t(node.definition_type)}
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: '17%' }}
              >
                {node.name && t(node.name)}
              </div>
              <div className={classes.bodyItem} style={{ width: dataColumns.description.width }}>
                {node.description && truncate(node?.description, 30)}
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.created.width }}
              >
                {node.created && fldt(node.created)}
              </div>
            </div>
          }
        />
        <ListItemSecondaryAction classes={{ root: classes.goIcon }}>
          <EntitiesDataMarkingsPopover
            history={history}
            nodeId={node?.id}
            node={node}
          />
        </ListItemSecondaryAction>
      </ListItem>
    );
  }
}

EntityDataMarkingLineComponent.propTypes = {
  dataColumns: PropTypes.object,
  node: PropTypes.object,
  history: PropTypes.object,
  classes: PropTypes.object,
  fd: PropTypes.func,
  t: PropTypes.func,
  onLabelClick: PropTypes.func,
};

const EntityDataMarkingLineFragment = createFragmentContainer(
  EntityDataMarkingLineComponent,
  {
    node: graphql`
      fragment EntityDataMarkingLine_node on DataMarking {
        ... on IEPMarking {
          id
          name
          affected_party_notifications
          attribution
          color
          created
          definition_type
          description
          encrypt_in_transit
          end_date
          entity_type
          iep_version
          modified
          permitted_actions
          start_date
          tlp
          unmodified_resale
          external_references {
            __typename
            id
            source_name
            description
            entity_type
            url
            hashes {
              value
            }
            external_id
          }
          notes {
            __typename
            id
            entity_type
            abstract
            content
            authors
          }
        }
        ... on TLPMarking {
          color
          created
          definition_type
          description
          entity_type
          id
          modified
          name
          tlp
          external_references {
            __typename
            id
            source_name
            description
            entity_type
            url
            hashes {
              value
            }
            external_id
          }
          notes {
            __typename
            id
            entity_type
            abstract
            content
            authors
          }
        }
        ... on StatementMarking {
          color
          created
          definition_type
          description
          entity_type
          id
          modified
          name
          statement
          external_references {
            __typename
            id
            source_name
            description
            entity_type
            url
            hashes {
              value
            }
            external_id
          }
          notes {
            __typename
            id
            entity_type
            abstract
            content
            authors
          }
        }
      }
    `,
  },
);

export const EntityDataMarkingLine = compose(
  inject18n,
  withStyles(styles),
)(EntityDataMarkingLineFragment);

class EntityDataMarkingLineDummyComponent extends Component {
  render() {
    const { classes, dataColumns } = this.props;
    return (
      <ListItem classes={{ root: classes.item }} divider={true}>
        <ListItemIcon classes={{ root: classes.itemIconDisabled }}>
          <Skeleton animation="wave" variant="circle" width={30} height={30} />
        </ListItemIcon>
        <ListItemText
          primary={
            <div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.type.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.name.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.description.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.created.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
            </div>
          }
        />
      </ListItem>
    );
  }
}

EntityDataMarkingLineDummyComponent.propTypes = {
  classes: PropTypes.object,
  dataColumns: PropTypes.object,
};

export const EntityDataMarkingLineDummy = compose(
  inject18n,
  withStyles(styles),
)(EntityDataMarkingLineDummyComponent);
