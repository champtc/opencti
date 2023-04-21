import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import { Slide, withStyles } from '@material-ui/core';
import inject18n from '../../../../../components/i18n';
import { QueryRenderer } from '../../../../../relay/environment';
import { toastGenericError } from '../../../../../utils/bakedToast';
import InformationTypeEntityEditionContainer from './InformationTypeEntityEditionContainer';

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

const informationTypeEntityEditionQuery = graphql`
  query InformationTypeEntityEditionQuery($id: ID!) {
    informationType(id: $id) {
      id
      entity_type
      created
      modified
      title
      description
      categorizations {
        id
        entity_type
        system
        catalog { 
          id 
          title
          system 
        }
        information_type {
          id
          entity_type
          identifier
          category
        }
      }
      confidentiality_impact {
        id
        entity_type
        base_impact
        selected_impact
        adjustment_justification
      }
      integrity_impact {
        id
        entity_type
        base_impact
        selected_impact
        adjustment_justification      
      }
      availability_impact {
        id
        entity_type
        base_impact
        selected_impact
        adjustment_justification      
      }
    }
  }
`;

class InformationTypeEntityEdition extends Component {
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
      informationTypeId,
    } = this.props;
    return (
      <div className={classes.container}>
        <QueryRenderer
          query={informationTypeEntityEditionQuery}
          variables={{ id: informationTypeId }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Failed to fetch information type');
            }
            if (props) {
              return (
                <InformationTypeEntityEditionContainer
                  open={displayEdit}
                  history={history}
                  informationType={props.informationType}
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

InformationTypeEntityEdition.propTypes = {
  leveragedAuthorizationId: PropTypes.string,
  displayEdit: PropTypes.bool,
  handleDisplayEdit: PropTypes.func,
  classes: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
};

export default compose(
  inject18n,
  withStyles(styles),
)(InformationTypeEntityEdition);
