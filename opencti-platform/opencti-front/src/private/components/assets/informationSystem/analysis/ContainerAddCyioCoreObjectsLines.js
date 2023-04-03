import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import graphql from 'babel-plugin-relay/macro';
import {
  map,
  filter,
  keys,
  groupBy,
  assoc,
  compose,
  append,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import { ExpandMore, CheckCircle } from '@material-ui/icons';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { commitMutation } from '../../../../../relay/environment';
import { truncate } from '../../../../../utils/String';
import ItemIcon from '../../../../../components/ItemIcon';
import inject18n from '../../../../../components/i18n';

const styles = (theme) => ({
  container: {
    padding: '20px 0 20px 0',
  },
  // expansionPanel: {
  //   backgroundColor: theme.palette.action.expansion,
  // },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  expansionPanelContent: {
    padding: 0,
  },
  list: {
    width: '100%',
  },
  listItem: {
    width: '100M',
  },
  icon: {
    color: theme.palette.primary.main,
  },
  tooltip: {
    maxWidth: '80%',
    lineHeight: 2,
    padding: 10,
    backgroundColor: '#323232',
  },
});

export const containerAddCyioCoreObjectsLinesRelationAddMutation = graphql`
  mutation ContainerAddCyioCoreObjectsLinesRelationAddMutation(
    $id: ID!,
    $entityId: ID!,
    $implementation_type: String!,
    
  ) {
    addInformationSystemImplementationEntity(id: $id, entityId: $entityId, implementation_type: $implementation_type) {
      id
    }
  }
`;

export const containerAddCyioCoreObjectsLinesRelationDeleteMutation = graphql`
  mutation ContainerAddCyioCoreObjectsLinesRelationDeleteMutation(
    $id: ID!,
    $entityId: ID!,
    $implementation_type: String!,
  ) {
    removeInformationSystemImplementationEntity(id: $id, entityId: $entityId, implementation_type: $implementation_type)
  }
`;

class ContainerAddCyioCoreObjectsLinesContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { expandedPanels: {}, addedCyioCoreObjects: [] };
  }

  getContainerCyioCoreObjectsIds() {
    const { containerCyioCoreObjects } = this.props;

    // eslint-disable-next-line no-underscore-dangle
    return map((n) => n.node.id, containerCyioCoreObjects || []);
  }

  toggleCyioCoreObject(cyioCoreObject) {
    const {
      containerId, paginationOptions, onAdd, onDelete,
    } = this.props;
    const { addedCyioCoreObjects } = this.state;
    const containerCyioCoreObjectsIds = this.getContainerCyioCoreObjectsIds();
    const alreadyAdded = addedCyioCoreObjects.includes(cyioCoreObject.id)
      || containerCyioCoreObjectsIds.includes(cyioCoreObject.id);
    if (alreadyAdded) {
      commitMutation({
        mutation: containerAddCyioCoreObjectsLinesRelationDeleteMutation,
        variables: {
          id: containerId,
          entityId: cyioCoreObject.id,
          implementationType: cyioCoreObject.entity_type,
        },
        onCompleted: () => {
          this.props.handleClose();
          if (typeof onDelete === 'function') {
            onDelete(cyioCoreObject);
          }
          this.setState({
            addedCyioCoreObjects: filter(
              (n) => n !== cyioCoreObject.id,
              this.state.addedCyioCoreObjects,
            ),
          });
        },
      });
    } else {
      commitMutation({
        mutation: containerAddCyioCoreObjectsLinesRelationAddMutation,
        variables: {
          id: containerId,
          entityId: cyioCoreObject.id,
          implementationType: cyioCoreObject.entity_type,
        },
        onCompleted: () => {
          this.props.handleClose();
          if (typeof onAdd === 'function') {
            onAdd(cyioCoreObject);
          }
          this.setState({
            addedCyioCoreObjects: append(
              cyioCoreObject.id,
              this.state.addedCyioCoreObjects,
            ),
          });
        },
      });
    }
  }

  handleChangePanel(panelKey, event, expanded) {
    this.setState({
      expandedPanels: assoc(panelKey, expanded, this.state.expandedPanels),
    });
  }

  render() {
    const {
      t, classes, data, fd,
    } = this.props;
    const { addedCyioCoreObjects } = this.state;
    const byType = groupBy((cyioCoreObject) => cyioCoreObject.entity_type);
    const cyioCoreObjects = byType(data);
    const cyioCoreObjectsTypes = keys(cyioCoreObjects);
    const containerCyioCoreObjectsIds = this.getContainerCyioCoreObjectsIds();
    return (
      <div className={classes.container}>
        {cyioCoreObjectsTypes.length > 0 ? (
          cyioCoreObjectsTypes.map((type, i) => (
            <Accordion
              key={i}
              onChange={this.handleChangePanel.bind(this, type)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography className={classes.heading}>
                  {t(type)}
                </Typography>
                <Typography className={classes.secondaryHeading}>
                  {cyioCoreObjects[type].length} {t('entitie(s)')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                classes={{ root: classes.expansionPanelContent }}
              >
                <List classes={{ root: classes.list }}>
                  {cyioCoreObjects[type].map((cyioCoreObject) => {
                    const alreadyAdded = addedCyioCoreObjects.includes(cyioCoreObject.id)
                      || containerCyioCoreObjectsIds.includes(cyioCoreObject.id);
                    return (
                      <ListItem
                        key={cyioCoreObject.id}
                        classes={{ root: classes.menuItem }}
                        divider={true}
                        button={true}
                        onClick={this.toggleCyioCoreObject.bind(
                          this,
                          cyioCoreObject,
                        )}
                      >
                        <ListItemIcon>
                          {alreadyAdded ? (
                            <CheckCircle classes={{ root: classes.icon }} />
                          ) : (
                            <ItemIcon type={type} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={truncate(
                            cyioCoreObject.name
                            || cyioCoreObject.title
                            || cyioCoreObject.system_name
                            || cyioCoreObject.display_name,
                            60,
                          )}
                          secondary={
                            <>
                              <Typography variant='inherit' gutterBottom>
                                {fd(cyioCoreObject.created)}
                              </Typography>
                              <Markdown
                                remarkPlugins={[remarkGfm, remarkParse]}
                                parserOptions={{ commonmark: true }}
                                className="markdown"
                              >
                                {truncate(
                                  cyioCoreObject.description,
                                  200,
                                )}
                              </Markdown>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <div style={{ paddingLeft: 20 }}>
            {t('No entities were found for this search.')}
          </div>
        )}
      </div>
    );
  }
}

ContainerAddCyioCoreObjectsLinesContainer.propTypes = {
  containerId: PropTypes.string,
  data: PropTypes.object,
  limit: PropTypes.number,
  classes: PropTypes.object,
  t: PropTypes.func,
  fld: PropTypes.func,
  paginationOptions: PropTypes.object,
  containerCyioCoreObjects: PropTypes.array,
  handleClose: PropTypes.func,
  onAdd: PropTypes.func,
  onDelete: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles),
)(ContainerAddCyioCoreObjectsLinesContainer);
