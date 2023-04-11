import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles/index';
import Slide from '@material-ui/core/Slide';
import inject18n from '../../../../../components/i18n';
import { QueryRenderer } from '../../../../../relay/environment';
import { toastGenericError } from '../../../../../utils/bakedToast';
import UserTypeEntityEditionContainer from './UserTypeEntityEditionContainer';

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

const userTypeEntityEditionQuery = graphql`
  query UserTypeEntityEditionQuery($id: ID!) {
    oscalUser(id: $id) {
      id
      created
      modified
      name
      description
      short_name
      user_type
      privilege_level
      roles {
        name
        id
      }
      authorized_privileges {
        id
        name
        description
        functions_performed
      }
    }
  }
`;

class UserTypeEntityEdition extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    };
  }

  render() {
    const {
      classes, displayEdit, handleDisplayEdit, history, userTypeId,
    } = this.props;
    return (
      <div className={classes.container}>
        <QueryRenderer
          query={userTypeEntityEditionQuery}
          variables={{ id: userTypeId }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Failed to edit Location');
            }
            if (props) {
              return (
                <UserTypeEntityEditionContainer
                  displayEdit={displayEdit}
                  history={history}
                  user={props.oscalUser}
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

UserTypeEntityEdition.propTypes = {
  locationId: PropTypes.string,
  displayEdit: PropTypes.bool,
  handleDisplayEdit: PropTypes.func,
  classes: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
};

export default compose(inject18n, withStyles(styles))(UserTypeEntityEdition);