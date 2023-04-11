import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import {
  AppBar,
  Dialog,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import inject18n from '../../../../../components/i18n';
import CyioExportButtons from '../../../../../components/CyioExportButtons';
import InformationSystemGraphTool, {
  informationSystemGraphToolQuery,
} from './InformationSystemGraphTool';
import { QueryRenderer } from '../../../../../relay/environment';
import Loader from '../../../../../components/Loader';

const styles = (theme) => ({
  appBar: {
    width: '100%',
    zIndex: theme.zIndex.drawer - 1,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.header.text,
  },
  appHeader: {
    margin: '10px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  container: {
    margin: 0,
  },
  gridContainer: {
    marginBottom: 20,
  },
  dialogMain: {
    overflow: 'hidden',
  },
  dialogClosebutton: {
    float: 'left',
    marginLeft: '15px',
    marginBottom: '20px',
  },
  dialogTitle: {
    padding: '24px 0 16px 24px',
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '10px 0 20px 22px',
  },
  buttonPopover: {
    textTransform: 'capitalize',
  },
  dialogContent: {
    padding: '0 24px',
    marginBottom: '24px',
    overflowY: 'scroll',
    backgroundColor: theme.palette.background.default,
  },
});

class InformationSystemGraphComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayCreate: '',
    };
  }

  render() {
    const {
      t,
      classes,
      displayGraph,
      handleCreateGraph,
      informationSystem,
    } = this.props;
    return (
      <Dialog
        open={displayGraph}
        maxWidth='xl'
        fullScreen={true}
        fullWidth={true}
        keepMounted={false}
        className={classes.dialogMain}
      >
        <AppBar
          className={classes.appBar}
          elevation={1}
        >
          <div className={classes.appHeader}>
            <Button
              variant='outlined'
              onClick={() => handleCreateGraph()}
              classes={{ root: classes.buttonPopover }}
            >
              {t('Close')}
            </Button>
            <CyioExportButtons
              domElementId="container"
              name={t('Report representation')}
              pixelRatio={2}
            />
          </div>
        </AppBar>
        <DialogContent classes={{ root: classes.dialogContent }}>
          <QueryRenderer
            query={informationSystemGraphToolQuery}
            variables={{ id: informationSystem.id }}
            render={({ props, retry }) => {
              if (props && props.informationSystem) {
                return (
                  <InformationSystemGraphTool
                    informationSystem={props.informationSystem}
                    refreshQuery={retry}
                  />
                );
              }
              return <Loader />;
            }}
          />
        </DialogContent>
        <DialogActions classes={{ root: classes.dialogClosebutton }}>
        </DialogActions>
      </Dialog>
    );
  }
}

InformationSystemGraphComponent.propTypes = {
  t: PropTypes.func,
  classes: PropTypes.object,
  displayGraph: PropTypes.bool,
  refreshQuery: PropTypes.func,
  handleCreateGraph: PropTypes.func,
  informationSystem: PropTypes.object,
};

const InformationSystemGraph = createFragmentContainer(InformationSystemGraphComponent, {
  informationSystem: graphql`
    fragment InformationSystemGraph_information on InformationSystem {
      id
      short_name
      system_name
      description
    }
  `,
});

export default compose(inject18n, withStyles(styles))(InformationSystemGraph);
