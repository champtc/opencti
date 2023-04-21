/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { createPaginationContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { pathOr } from 'ramda';
import ListLinesContent from '../../../../../components/list_lines/ListLinesContent';
import { setNumberOfElements } from '../../../../../utils/Number';
import { EntityUserTypesLine, EntityUserTypesLineDummy } from './EntityUserTypesLine';

const nbOfRowsToLoad = 50;

class EntitiesUserTypesLines extends Component {
  constructor(props) {
    super(props);
    this.state = { offset: 0 };
  }

  componentDidUpdate(prevProps) {
    setNumberOfElements(
      prevProps,
      this.props,
      'oscalUsers',
      this.props.setNumberOfElements.bind(this),
    );
  }

  handleIncrementedOffsetChange() {
    const incrementedOffset = this.state.offset += nbOfRowsToLoad;
    this.setState({ offset: incrementedOffset });
    this.props.relay.refetchConnection(nbOfRowsToLoad, null, {
      offset: this.state.offset,
      first: nbOfRowsToLoad,
      ...this.props.paginationOptions,
    });
  }

  handleDecrementedOffsetChange() {
    const decrementedOffset = this.state.offset -= nbOfRowsToLoad;
    this.setState({ offset: decrementedOffset });
    this.props.relay.refetchConnection(nbOfRowsToLoad, null, {
      offset: this.state.offset,
      first: nbOfRowsToLoad,
      ...this.props.paginationOptions,
    });
  }

  render() {
    const {
      relay,
      history,
      selectAll,
      dataColumns,
      onLabelClick,
      initialLoading,
      onToggleEntity,
      selectedElements,
    } = this.props;
    return (
      <ListLinesContent
        initialLoading={initialLoading}
        loadMore={relay.loadMore.bind(this)}
        handleIncrementedOffsetChange={this.handleIncrementedOffsetChange.bind(this)}
        handleDecrementedOffsetChange={this.handleDecrementedOffsetChange.bind(this)}
        hasMore={relay.hasMore.bind(this)}
        isLoading={relay.isLoading.bind(this)}
        dataList={pathOr([], ['oscalUsers', 'edges'], this.props.data)}
        globalCount={pathOr(
          nbOfRowsToLoad,
          ['oscalUsers', 'pageInfo', 'globalCount'],
          this.props.data,
        )}
        offset={this.state.offset}
        LineComponent={<EntityUserTypesLine history={history} />}
        DummyLineComponent={<EntityUserTypesLineDummy />}
        selectAll={selectAll}
        dataColumns={dataColumns}
        nbOfRowsToLoad={nbOfRowsToLoad}
        selectedElements={selectedElements}
        onLabelClick={onLabelClick.bind(this)}
        onToggleEntity={onToggleEntity.bind(this)}
      />
    );
  }
}

EntitiesUserTypesLines.propTypes = {
  classes: PropTypes.object,
  history: PropTypes.object,
  paginationOptions: PropTypes.object,
  dataColumns: PropTypes.object.isRequired,
  data: PropTypes.object,
  relay: PropTypes.object,
  threatActors: PropTypes.object,
  computingDeviceAssetList: PropTypes.object,
  initialLoading: PropTypes.bool,
  onLabelClick: PropTypes.func,
  setNumberOfElements: PropTypes.func,
};

export const entitiesUserTypesLinesQuery = graphql`
  query EntitiesUserTypesLinesPaginationQuery(
    $search: String
    $first: Int!
    $offset: Int!
    $cursor: ID
    $orderedBy: OscalUsersOrdering
    $orderMode: OrderingMode
    $filters: [OscalUsersFiltering]
    $filterMode: FilterMode
  ) {
    ...EntitiesUserTypesLines_data
      @arguments(
        search: $search
        first: $first
        offset: $offset
        cursor: $cursor
        orderedBy: $orderedBy
        orderMode: $orderMode
        filters: $filters
        filterMode: $filterMode
      )
  }
`;

export default createPaginationContainer(
  EntitiesUserTypesLines,
  {
    data: graphql`
      fragment EntitiesUserTypesLines_data on Query
      @argumentDefinitions(
        search: { type: "String" }
        first: { type: "Int", defaultValue: 50 }
        offset: { type: "Int", defaultValue: 0 }
        cursor: { type: "ID" }
        orderedBy: { type: "OscalUsersOrdering", defaultValue: created }
        orderMode: { type: "OrderingMode", defaultValue: asc }
        filters: { type: "[OscalUsersFiltering]" }
        filterMode: { type: "FilterMode" }
      ) {
        oscalUsers(
          search: $search
          first: $first
          offset: $offset
          orderedBy: $orderedBy
          orderMode: $orderMode
          filters: $filters
          filterMode: $filterMode
        ) @connection(key: "Pagination_oscalUsers") {
          edges {
            node {
              id
              name
              description
              ...EntityUserTypesLine_node
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            globalCount
          }
        }
      }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.data && props.data.oscalUsers;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        search: fragmentVariables.search,
        first: fragmentVariables.first,
        offset: fragmentVariables.offset,
        count,
        cursor,
        orderedBy: fragmentVariables.orderedBy,
        orderMode: fragmentVariables.orderMode,
        filters: fragmentVariables.filters,
        filterMode: fragmentVariables.filterMode,
      };
    },
    query: entitiesUserTypesLinesQuery,
  },
);
