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
import EntitiesUserTypesCreation from './EntitiesUserTypesCreation';
import UserTypesEntityEditionContainer from './UserTypeEntityEditionContainer';
import EntitiesUserTypesPopover from './EntitiesUserTypesPopover';
import EntitiesUserTypesDeletion from './EntitiesUserTypesDeletion';
import EntityUserTypesDetails from './EntityUserTypesDetails';
import EntityUserTypesOverview from './EntityUserTypesOverview';

const styles = () => ({
  container: {
    margin: '0 0 40px 0',
  },
  gridContainer: {
    marginBottom: 20,
  },
});

class EntityUserTypeComponent extends Component {
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
      classes, location, history, refreshQuery,
    } = this.props;
    return (
      <>
        <div className={classes.container}>
          <CyioDomainObjectHeader
            history={history}
            name={location.name}
            cyioDomainObject={location}
            goBack="/data/entities/user_types"
            PopoverComponent={<EntitiesUserTypesPopover />}
            OperationsComponent={<EntitiesUserTypesDeletion />}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
            handleOpenNewCreation={this.handleOpenNewCreation.bind(this)}
          />
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
          >
             <Grid item={true} xs={6}>
              <EntityUserTypesOverview
                location={location}
                history={history}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <EntityUserTypesDetails
                location={location}
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
                typename={location.__typename}
                externalReferences={location.links}
                fieldName="links"
                cyioCoreObjectId={location?.id}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <CyioCoreObjectOrCyioCoreRelationshipNotes
                typename={location.__typename}
                notes={location.remarks}
                refreshQuery={refreshQuery}
                fieldName="remarks"
                marginTop="0px"
                cyioCoreObjectOrCyioCoreRelationshipId={location?.id}
              />
            </Grid>
          </Grid>
        </div>
        <EntitiesUserTypesCreation
          openDataCreation={this.state.openDataCreation}
          handleLocationCreation={this.handleOpenNewCreation.bind(this)}
          history={history}
        />
        <UserTypesEntityEditionContainer
          displayEdit={this.state.displayEdit}
          history={history}
          location={location}
          handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        />
      </>
    );
  }
}

EntityUserTypeComponent.propTypes = {
  location: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  refreshQuery: PropTypes.func,
};

const EntityUserType = createFragmentContainer(EntityUserTypeComponent, {
  location: graphql`
    fragment EntityUserType_userType on OscalLocation {
      __typename
      id
      created
      modified
      name
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
      ...EntityUserTypesOverview_userType
      ...EntityUserTypesDetails_userType
    }
  `,
});

export default compose(inject18n, withStyles(styles))(EntityUserType);
