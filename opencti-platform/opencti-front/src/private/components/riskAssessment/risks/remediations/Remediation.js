/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { Redirect } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import inject18n from '../../../../../components/i18n';
import RiskDetails from '../RiskDetails';
import RemediationEdition from './RemediationEdition';
import RiskPopover from '../RiskPopover';
import RemediationDeletion from './RemediationDeletion';
import RiskCreation from '../RiskCreation';
import StixCoreObjectOrStixCoreRelationshipLastReports from '../../../analysis/reports/StixCoreObjectOrStixCoreRelationshipLastReports';
import StixDomainObjectHeader from '../../../common/stix_domain_objects/StixDomainObjectHeader';
import CyioDomainObjectHeader from '../../../common/stix_domain_objects/CyioDomainObjectHeader';
import Security, { KNOWLEDGE_KNUPDATE } from '../../../../../utils/Security';
import CyioCoreObjectOrCyioCoreRelationshipNotes from '../../../analysis/notes/CyioCoreObjectOrCyioCoreRelationshipNotes';
import RemediationGeneralOverview from './RemediationGeneralOverview';
import CyioCoreObjectExternalReferences from '../../../analysis/external_references/CyioCoreObjectExternalReferences';
import StixCoreObjectLatestHistory from '../../../common/stix_core_objects/StixCoreObjectLatestHistory';
import SimpleStixObjectOrStixRelationshipStixCoreRelationships from '../../../common/stix_core_relationships/SimpleStixObjectOrStixRelationshipStixCoreRelationships';
import RequiredResources from './RequiredResources';
import RelatedTasks from './RelatedTasks';
import TopMenuRisk from '../../../nav/TopMenuRisk';
import RemediationGeneralDetails from './RemediationGeneralDetails';
import RemediationDetailsPopover from './RemediationDetailsPopover';
import RemediationCreation from './RemediationCreation';

const styles = () => ({
  container: {
    margin: 0,
  },
  gridContainer: {
    marginBottom: 20,
  },
});

class RemediationComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayEdit: false,
      openCreation: false,
    };
  }

  handleDisplayEdit() {
    this.setState({ displayEdit: !this.state.displayEdit });
  }

  handleOpen() {
    this.setState({ openCreation: true });
  }

  handleClose() {
    this.setState({ openCreation: false })
  }

  handleOpenCreation() {
    this.setState({ openCreation: false });
  }

  render() {
    const {
      classes,
      remediation,
      refreshQuery,
      risk,
      riskId,
      history,
      location,
    } = this.props;
    return (
      <>
        <div className={classes.container}>
          <CyioDomainObjectHeader
            cyioDomainObject={remediation}
            history={history}
            disablePopover={false}
            PopoverComponent={<RiskPopover />}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
            handleOpenNewCreation={this.handleOpen.bind(this)}
            OperationsComponent={<RemediationDeletion riskId={riskId}/>}
          />
          <TopMenuRisk risk={risk.name} remediation={remediation} breadcrumbs={true} />
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
          >
            <Grid item={true} xs={12}>
              <RemediationGeneralOverview
                remediation={remediation}
                risk={risk}
              />
            </Grid>
            {/* <Grid item={true} xs={6}>
                <RemediationGeneralDetails remediation={remediation} />
              </Grid> */}
          </Grid>
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
            style={{ marginTop: 25 }}
          >
            <Grid item={true} xs={6}>
              <RequiredResources history={history} remediationId={remediation.id} />
            </Grid>
            <Grid item={true} xs={6}>
              <RelatedTasks
                toType='OscalTask'
                fromType= 'RiskResponse'
                history={history}
                remediationId={remediation.id}
              />
            </Grid>
          </Grid>
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
            style={{ marginTop: 50 }}
          >
            <Grid item={true} xs={6}>
              <CyioCoreObjectExternalReferences
                typename={remediation.__typename}
                fieldName='links'
                externalReferences={remediation.links}
                cyioCoreObjectId={remediation.id}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <CyioCoreObjectOrCyioCoreRelationshipNotes
                typename={remediation.__typename}
                notes={remediation.remarks}
                fieldName='remarks'
                cyioCoreObjectOrCyioCoreRelationshipId={remediation.id}
                marginTop='0px'
                refreshQuery={refreshQuery}
              />
            </Grid>
          </Grid>
          {/* <Security needs={[KNOWLEDGE_KNUPDATE]}>
                <RemediationEdition riskId={remediation.id} />
              </Security> */}
          <RemediationDetailsPopover
            displayEdit={this.state.displayEdit}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
            remediation={remediation}
            history={history}
            cyioCoreRelationshipId={remediation.id}
            risk={risk}
            riskId={riskId}
          />
          <RemediationCreation
            remediationId={remediation.id}
            riskId={riskId}
            history={history}
            openCreation={this.state.openCreation}
            handleOpenCreation={this.handleOpenCreation.bind(this)}
        />
        </div>
        {/* <RemediationEdition
            open={this.state.openEdit}
            riskId={riskId}
            remediationId={remediation.id}
            history={history}
            remediation={remediation}
          /> */}
      </>
    );
  }
}

RemediationComponent.propTypes = {
  riskId: PropTypes.string,
  remediation: PropTypes.object,
  classes: PropTypes.object,
  risk: PropTypes.object,
  t: PropTypes.func,
  refreshQuery: PropTypes.func,
};

const Remediation = createFragmentContainer(RemediationComponent, {
  remediation: graphql`
    fragment Remediation_remediation on RiskResponse {
      __typename
      id
      name
      description
      modified
      created
      lifecycle
      response_type
      origins{            # source of detection
        id
        origin_actors {
          actor_type
          actor_ref {
            ... on AssessmentPlatform {
              id
              name          # Source
            }
            ... on Component {
              id
              component_type
              name
            }
            ... on OscalParty {
            id
            party_type
            name            # Source
            }
          }
        }
      }
      links {
        __typename
        id
        # created
        # modified
        external_id
        source_name
        description
        url
        media_type
        entity_type
      }
      remarks {
        __typename
        id
        abstract
        content
        authors
        entity_type
      }
      ...RemediationGeneralOverview_remediation
      # ...RemediationGeneralDetails_remediation
    }
  `,
});

export default compose(inject18n, withStyles(styles))(Remediation);
