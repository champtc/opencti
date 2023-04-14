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
import EntitiesDataMarkingsPopover from './EntitiesDataMarkingsPopover';
import EntitiesDataMarkingsDeletion from './EntitiesDataMarkingsDeletion';
import DataMarkingEntityEditionContainer from './DataMarkingEntityEditionContainer';
import EntitiesDataMarkingsCreation from './EntitiesDataMarkingsCreation';
import EntityDataMarkingOverview from './EntityDataMarkingOverview';
import EntityDataMarkingStatementDetails from './EntityDataMarkingStatementDetails';
import EntityDataMarkingTLPDetails from './EntityDataMarkingTLPDetails';
import EntityDataMarkingIEPDetails from './EntityDataMarkingIEPDetails';

const styles = () => ({
  container: {
    margin: '0 0 40px 0',
  },
  gridContainer: {
    marginBottom: 20,
  },
});

class EntityDataMarkingComponent extends Component {
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
      classes, dataMarking, history, refreshQuery,
    } = this.props;
    return (
      <>
        <div className={classes.container}>
          <CyioDomainObjectHeader
            history={history}
            name={dataMarking.name}
            cyioDomainObject={dataMarking}
            goBack='/data/entities/data_markings'
            PopoverComponent={<EntitiesDataMarkingsPopover />}
            OperationsComponent={<EntitiesDataMarkingsDeletion />}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
            handleOpenNewCreation={this.handleOpenNewCreation.bind(this)}
          />
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
          >
            <Grid item={true} xs={6}>
              <EntityDataMarkingOverview
                dataMarking={dataMarking}
                history={history}
                refreshQuery={refreshQuery}
              />
            </Grid>
            {dataMarking.definition_type === 'statement' && (
              <Grid item={true} xs={6}>
                <EntityDataMarkingStatementDetails
                  dataMarking={dataMarking}
                  history={history}
                />
              </Grid>
            )}
            {dataMarking.definition_type === 'tlp' && (
              <Grid item={true} xs={6}>
                <EntityDataMarkingTLPDetails
                  dataMarking={dataMarking}
                  history={history}
                />
              </Grid>
            )}
            {dataMarking.definition_type === 'iep' && (
              <Grid item={true} xs={6}>
                <EntityDataMarkingIEPDetails
                  dataMarking={dataMarking}
                  history={history}
                />
              </Grid>
            )}
          </Grid>
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
            style={{ marginTop: 25 }}
          >
            <Grid item={true} xs={6}>
              <CyioCoreObjectExternalReferences
                typename={dataMarking.__typename}
                externalReferences={dataMarking.links}
                fieldName='links'
                cyioCoreObjectId={dataMarking?.id}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <CyioCoreObjectOrCyioCoreRelationshipNotes
                typename={dataMarking.__typename}
                notes={dataMarking.remarks}
                refreshQuery={refreshQuery}
                fieldName='remarks'
                marginTop='0px'
                cyioCoreObjectOrCyioCoreRelationshipId={dataMarking?.id}
              />
            </Grid>
          </Grid>
        </div>
        <EntitiesDataMarkingsCreation
          openDataCreation={this.state.openDataCreation}
          handleLocationCreation={this.handleOpenNewCreation.bind(this)}
          history={history}
        />
        <DataMarkingEntityEditionContainer
          displayEdit={this.state.displayEdit}
          history={history}
          dataMarking={dataMarking}
          handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        />
      </>
    );
  }
}

EntityDataMarkingComponent.propTypes = {
  dataMaking: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  refreshQuery: PropTypes.func,
};

const EntityDataMarking = createFragmentContainer(EntityDataMarkingComponent, {
  dataMarking: graphql`
    fragment EntityDataMarking_dataMarking on DataMarking {
      ... on DataMarkingObject {
        id
        entity_type
        created
        modified
        definition_type
        color
      }
      ... on StatementMarking {
        description
        statement
        name
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
        id
        description
        color
        created
        description
        definition_type
        entity_type
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
      ... on IEPMarking {
        id
        entity_type
        definition_type
        description
        created
        color
        attribution
        encrypt_in_transit
        end_date
        iep_version
        modified
        name
        tlp
        unmodified_resale
        start_date
        permitted_actions
        affected_party_notifications
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
});

export default compose(inject18n, withStyles(styles))(EntityDataMarking);
