/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import inject18n from '../../../../components/i18n';
import AssessmentDetails from './AssessmentDetails';
import AssessmentsPopover from './AssessmentsPopover';
import AssessmentsDeletion from './AssessmentsDeletion';
import CyioDomainObjectHeader from '../../common/stix_domain_objects/CyioDomainObjectHeader';
import CyioCoreObjectOrCyioCoreRelationshipNotes from '../../analysis/notes/CyioCoreObjectOrCyioCoreRelationshipNotes';
import CyioCoreObjectExternalReferences from '../../analysis/external_references/CyioCoreObjectExternalReferences';
import AssessmentEditionContainer from './AssessmentEditionContainer';
import AssessmentsCreation from './AssessmentsCreation';
import AssessmentOverview from './AssessmentOverview';

const styles = () => ({
  container: {
    margin: 0,
  },
  gridContainer: {
    marginBottom: 20,
  },
});

class AssessmentComponent extends Component {
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
      classes,
      assessment,
      history,
      refreshQuery,
      location,
    } = this.props;
    return (
      <>
        <div className={classes.container}>
          <CyioDomainObjectHeader
            name={assessment.name}
            history={history}
            cyioDomainObject={assessment}
            goBack='/data/entities/tasks'
            // PopoverComponent={<AssessmentsPopover />}
            OperationsComponent={<AssessmentsDeletion />}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
            handleOpenNewCreation={this.handleOpenNewCreation.bind(this)}
          />
          <Grid
            container={true}
            spacing={3}
            classes={{ container: classes.gridContainer }}
          >
            <Grid item={true} xs={6}>
              <AssessmentOverview assessment={assessment} history={history} refreshQuery={refreshQuery} />
            </Grid>
            <Grid item={true} xs={6}>
              <AssessmentDetails assessment={assessment} history={history} refreshQuery={refreshQuery} />
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
                typename={assessment.__typename}
                externalReferences={assessment.links}
                fieldName='links'
                cyioCoreObjectId={assessment?.id}
                refreshQuery={refreshQuery}
              />
            </Grid>
            <Grid item={true} xs={6}>
              <CyioCoreObjectOrCyioCoreRelationshipNotes
                typename={assessment.__typename}
                notes={assessment.remarks}
                refreshQuery={refreshQuery}
                fieldName='remarks'
                marginTop='0px'
                cyioCoreObjectOrCyioCoreRelationshipId={assessment?.id}
              />
            </Grid>
          </Grid>
        </div>
        <AssessmentsCreation
          openDataCreation={this.state.openDataCreation}
          handleTaskCreation={this.handleOpenNewCreation.bind(this)}
          history={history}
          assessment={assessment}
        />
        <AssessmentEditionContainer
          displayEdit={this.state.displayEdit}
          history={history}
          assessment={assessment}
          refreshQuery={refreshQuery}
          handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        />
      </>
    );
  }
}

AssessmentComponent.propTypes = {
  assessment: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  refreshQuery: PropTypes.func,
};

const Assessment = createFragmentContainer(AssessmentComponent, {
  assessment: graphql`
    fragment Assessment_data on Risk {
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
      ...AssessmentOverview_data
      ...AssessmentDetails_data
    }
  `,
});

export default compose(inject18n, withStyles(styles))(Assessment);
