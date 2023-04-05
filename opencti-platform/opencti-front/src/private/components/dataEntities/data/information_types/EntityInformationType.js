/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import inject18n from '../../../../../components/i18n';
import CyioDomainObjectHeader from '../../../common/stix_domain_objects/CyioDomainObjectHeader';
import CyioCoreObjectOrCyioCoreRelationshipNotes from '../../../analysis/notes/CyioCoreObjectOrCyioCoreRelationshipNotes';
import CyioCoreObjectExternalReferences from '../../../analysis/external_references/CyioCoreObjectExternalReferences';
import InformationTypeEntityEditionContainer from './InformationTypeEntityEditionContainer';
import EntitiesInformationTypesCreation from './EntitiesInformationTypesCreation';
import EntityInformationTypeDetails from './EntityInformationTypeDetails';
import EntityInformationTypeOverview from './EntityInformationTypeOverview';
import EntitiesInformationTypesPopover from './EntitiesInformationTypesPopover';
import EntitiesInformationTypesDeletion from './EntitiesInformationTypesDeletion';

const styles = () => ({
  container: {
    margin: '0 0 40px 0',
  },
  gridContainer: {
    marginBottom: 20,
  },
});

class EntityInformationTypeComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayEdit: false,
      openDataCreation: false,
    };
  }

  handleDisplayEdit() {
    this.setState({ displayEdit: !this.state.displayEdit });
  }

  handleOpenNewCreation() {
    this.setState({ openDataCreation: !this.state.openDataCreation });
  }

  render() {
    const {
      classes, informationType, history, refreshQuery,
    } = this.props;
    return (
      <>
        <div className={classes.container}>
          <CyioDomainObjectHeader
            history={history}
            name={informationType.title}
            cyioDomainObject={informationType}
            goBack="/data/entities/information_types"
            PopoverComponent={<EntitiesInformationTypesPopover />}
            OperationsComponent={<EntitiesInformationTypesDeletion />}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
            handleOpenNewCreation={this.handleOpenNewCreation.bind(this)}
          />
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
          >
            <Grid item={true} xs={6}>
              <EntityInformationTypeOverview
                informationType={informationType}
                history={history}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <EntityInformationTypeDetails
                informationType={informationType}
                history={history}
                refreshQuery={refreshQuery}
              />
            </Grid>
          </Grid>
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
            style={{ marginTop: 25 }}
          >
            <Grid item={true} xs={6}>
              <CyioCoreObjectExternalReferences
                typename={informationType.__typename}
                externalReferences={informationType.links}
                fieldName="links"
                cyioCoreObjectId={informationType?.id}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <CyioCoreObjectOrCyioCoreRelationshipNotes
                typename={informationType.__typename}
                notes={informationType.remarks}
                refreshQuery={refreshQuery}
                fieldName="remarks"
                marginTop="0px"
                cyioCoreObjectOrCyioCoreRelationshipId={
                  informationType?.id
                }
              />
            </Grid>
          </Grid>
        </div>
        <EntitiesInformationTypesCreation
          openDataCreation={this.state.openDataCreation}
          handleLocationCreation={this.handleOpenNewCreation.bind(this)}
          history={history}
        />
        <InformationTypeEntityEditionContainer
          open={this.state.displayEdit}
          history={history}
          informationType={informationType}
          handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        />
      </>
    );
  }
}

EntityInformationTypeComponent.propTypes = {
  leveragedAuthorization: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  refreshQuery: PropTypes.func,
};

const EntityInformationType = createFragmentContainer(
  EntityInformationTypeComponent,
  {
    informationType: graphql`
      fragment EntityInformationType_informationType on InformationType {
        __typename
        id
        created
        modified
        title
        description
        labels {
          __typename
          id
          name
          color
          entity_type
          description
        }
        links {
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
        remarks {
          __typename
          id
          entity_type
          abstract
          content
          authors
        }
        ...EntityInformationTypeOverview_informationType
        ...EntityInformationTypeDetails_informationType
      }
    `,
  },
);

export default compose(
  inject18n,
  withStyles(styles),
)(EntityInformationType);
