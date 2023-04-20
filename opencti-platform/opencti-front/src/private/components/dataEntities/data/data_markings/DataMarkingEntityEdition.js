import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles/index';
import Slide from '@material-ui/core/Slide';
import inject18n from '../../../../../components/i18n';
import { QueryRenderer } from '../../../../../relay/environment';
import { toastGenericError } from '../../../../../utils/bakedToast';
import DataMarkingEntityEditionContainer from './DataMarkingEntityEditionContainer';

const styles = (theme) => ({
  container: {
    margin: 0,
  },
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    position: 'fixed',
    overflow: 'auto',
    backgroundColor: theme.palette.navAlt.background,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    padding: 0,
  },
  popoverDialog: {
    fontSize: '18px',
    lineHeight: '24px',
    color: theme.palette.header.text,
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '10px 0 20px 22px',
  },
  buttonPopover: {
    textTransform: 'capitalize',
  },
  menuItem: {
    padding: '15px 0',
    width: '152px',
    margin: '0 20px',
    justifyContent: 'center',
  },
});

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

const dataMarkingEntityEditionQuery = graphql`
  query DataMarkingEntityEditionQuery($id: ID!) {
    dataMarking(id: $id) {
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
      }
    }
  }
`;

class DataMarkingEntityEdition extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    };
  }

  render() {
    const {
      classes,
      displayEdit,
      handleDisplayEdit,
      history,
      dataMarkingId,
    } = this.props;
    return (
      <div className={classes.container}>
        <QueryRenderer
          query={dataMarkingEntityEditionQuery}
          variables={{ id: dataMarkingId }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Failed to edit data marking');
            }
            if (props) {
              return (
                <DataMarkingEntityEditionContainer
                  displayEdit={displayEdit}
                  history={history}
                  dataMarking={props.dataMarking}
                  handleDisplayEdit={handleDisplayEdit}
                />
              );
            }
            return <></>;
          }}
        />
      </div>
    );
  }
}

DataMarkingEntityEdition.propTypes = {
  dataMarkingId: PropTypes.string,
  displayEdit: PropTypes.bool,
  handleDisplayEdit: PropTypes.func,
  classes: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
};

export default compose(inject18n, withStyles(styles))(DataMarkingEntityEdition);