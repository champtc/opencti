/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer as QR } from 'react-relay';
import environmentDarkLight from '../../../../relay/environmentDarkLight';
import { commitMutation } from '../../../../relay/environment';
import inject18n from '../../../../components/i18n';
import NetworkEditionContainer from './NetworkEditionContainer';
import { networkEditionOverviewFocus } from './NetworkEditionOverview';
import Loader from '../../../../components/Loader';

const styles = (theme) => ({
  editButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
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
});

export const networkEditionQuery = graphql`
  query NetworkEditionContainerQuery($id: ID!) {
    networkAsset(id: $id) {
      ...NetworkEditionContainer_network
    }
    # settings {
    #   platform_enable_reference
    # }
  }
`;

class NetworkEdition extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    commitMutation({
      mutation: networkEditionOverviewFocus,
      variables: {
        id: this.props.networkId,
        input: { focusOn: '' },
      },
    });
    this.setState({ open: false });
  }

  render() {
    const { networkId, history } = this.props;
    return (
      <div>
        <QR
          environment={environmentDarkLight}
          query={networkEditionQuery}
          variables={{ id: networkId }}
          render={({ props, retry }) => {
            if (props) {
              return (
                <NetworkEditionContainer
                  network={props.networkAsset}
                  // enableReferences={props.settings.platform_enable_reference?.includes(
                  //   'Network',
                  // )}
                  history={history}
                  refreshQuery={retry}
                  handleClose={this.handleClose.bind(this)}
                />
              );
            }
            return <Loader variant="inElement" />;
          }}
        />
      </div>
    );
  }
}

NetworkEdition.propTypes = {
  networkId: PropTypes.string,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(NetworkEdition);
