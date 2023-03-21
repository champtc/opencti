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
import EntitiesLeveragedAuthorizationsPopover from './EntitiesLeveragedAuthorizationsPopover';
import EntitiesLeveragedAuthorizationsDeletion from './EntitiesLeveragedAuthorizationsDeletion';
import EntityLeveragedAuthorizationDetails from './EntityLeveragedAuthorizationDetails';
import EntitiesLeveragedAuthorizationsCreation from './EntitiesLeveragedAuthorizationsCreation';
import LeveragedAuthorizationEntityEditionContainer from './LeveragedAuthorizationEntityEditionContainer';
import EntityLeveragedAuthorizationOverview from './EntityLeveragedAuthorizationOverview';

const styles = () => ({
  container: {
    margin: '0 0 40px 0',
  },
  gridContainer: {
    marginBottom: 20,
  },
});

class EntityLeveragedAuthorizationComponent extends Component {
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
      classes, leveragedAuthorization, history, refreshQuery,
    } = this.props;
    return (
      <>
        <div className={classes.container}>
          <CyioDomainObjectHeader
            history={history}
            name={leveragedAuthorization.name}
            cyioDomainObject={leveragedAuthorization}
            goBack="/data/entities/leveraged_authorizations"
            PopoverComponent={<EntitiesLeveragedAuthorizationsPopover />}
            OperationsComponent={<EntitiesLeveragedAuthorizationsDeletion />}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
            handleOpenNewCreation={this.handleOpenNewCreation.bind(this)}
          />
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
          >
            <Grid item={true} xs={6}>
              <EntityLeveragedAuthorizationOverview
                leveragedAuthorization={leveragedAuthorization}
                history={history}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <EntityLeveragedAuthorizationDetails
                leveragedAuthorization={leveragedAuthorization}
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
                typename={leveragedAuthorization.__typename}
                externalReferences={leveragedAuthorization.links}
                fieldName="links"
                cyioCoreObjectId={leveragedAuthorization?.id}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <CyioCoreObjectOrCyioCoreRelationshipNotes
                typename={leveragedAuthorization.__typename}
                notes={leveragedAuthorization.remarks}
                refreshQuery={refreshQuery}
                fieldName="remarks"
                marginTop="0px"
                cyioCoreObjectOrCyioCoreRelationshipId={leveragedAuthorization?.id}
              />
            </Grid>
          </Grid>
        </div>
        <EntitiesLeveragedAuthorizationsCreation
          openDataCreation={this.state.openDataCreation}
          handleLocationCreation={this.handleOpenNewCreation.bind(this)}
          history={history}
        />
        <LeveragedAuthorizationEntityEditionContainer
          displayEdit={this.state.displayEdit}
          history={history}
          leveragedAuthorization={leveragedAuthorization}
          handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        />
      </>
    );
  }
}

EntityLeveragedAuthorizationComponent.propTypes = {
  leveragedAuthorization: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  refreshQuery: PropTypes.func,
};

const EntityLeveragedAuthorization = createFragmentContainer(
  EntityLeveragedAuthorizationComponent,
  {
    leveragedAuthorization: graphql`
      fragment EntityLeveragedAuthorization_leveragedAuthorization on OscalLeveragedAuthorization {
        __typename
        id
        created
        modified
        title
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
        ...EntityLeveragedAuthorizationOverview_leveragedAuthorization
        ...EntityLeveragedAuthorizationDetails_leveragedAuthorization
      }
    `,
  },
);

export default compose(
  inject18n,
  withStyles(styles),
)(EntityLeveragedAuthorization);
