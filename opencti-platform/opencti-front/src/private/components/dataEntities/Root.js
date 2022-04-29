import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Switch, Redirect } from 'react-router-dom';
import { BoundaryRoute } from '../Error';
import Entities from './Entities';
import DataSources from './DataSources';

class Root extends Component {
  render() {
    const { me } = this.props;
    return (
      <Switch>
        <BoundaryRoute
          exact
          path="/data"
          render={() => <Redirect to="/data/entities" />}
        />
        <BoundaryRoute
          exact
          path="/data/entities"
          component={Entities}
        />
        <BoundaryRoute
          exact
          path="/data/data source"
          component={DataSources}
        />
        {/* <BoundaryRoute
          path="/data/entities/:entityId"
          render={(routeProps) => <RootDevice {...routeProps} me={me} />}
        />
        <BoundaryRoute
          path="/data/data source/:dataSourceId"
          render={(routeProps) => <RootDevice {...routeProps} me={me} />}
        /> */}
      </Switch>
    );
  }
}

Root.propTypes = {
  me: PropTypes.object,
};

export default Root;