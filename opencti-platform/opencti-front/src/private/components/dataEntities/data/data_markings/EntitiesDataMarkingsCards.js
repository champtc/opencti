/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { createPaginationContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { pathOr } from 'ramda';
import CyioListCardsContent from '../../../../../components/list_cards/CyioListCardsContent';
import { setNumberOfElements } from '../../../../../utils/Number';
import { EntityDataMarkingCard, EntityDataMarkingCardDummy } from './EntityDataMarkingCard';

const nbOfCardsToLoad = 50;

class EntitiesDataMarkingsCards extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookmarks: [],
      offset: 0,
    };
  }

  componentDidUpdate(prevProps) {
    setNumberOfElements(
      prevProps,
      this.props,
      'dataMarking',
      this.props.setNumberOfElements.bind(this),
    );
  }

  handleSetBookmarkList(bookmarks) {
    this.setState({ bookmarks });
  }

  handleIncrementedOffsetChange() {
    const incrementedOffset = this.state.offset += nbOfCardsToLoad;
    this.setState({ offset: incrementedOffset });
    this.props.relay.refetchConnection(nbOfCardsToLoad, null, {
      offset: this.state.offset,
      first: nbOfCardsToLoad,
      ...this.props.paginationOptions,
    });
  }

  handleDecrementedOffsetChange() {
    const decrementedOffset = this.state.offset -= nbOfCardsToLoad;
    this.setState({ offset: decrementedOffset });
    this.props.relay.refetchConnection(nbOfCardsToLoad, null, {
      offset: this.state.offset,
      first: nbOfCardsToLoad,
      ...this.props.paginationOptions,
    });
  }

  render() {
    const {
      initialLoading,
      relay,
      history,
      selectAll,
      onLabelClick,
      onToggleEntity,
      selectedElements,
    } = this.props;
    const { bookmarks, offset } = this.state;
    return (
      <CyioListCardsContent
        initialLoading={initialLoading}
        loadMore={relay.loadMore.bind(this)}
        handleIncrementedOffsetChange={this.handleIncrementedOffsetChange.bind(this)}
        handleDecrementedOffsetChange={this.handleDecrementedOffsetChange.bind(this)}
        hasMore={relay.hasMore.bind(this)}
        isLoading={relay.isLoading.bind(this)}
        dataList={pathOr([], ['dataMarkings', 'edges'], this.props.data)}
        globalCount={pathOr(
          nbOfCardsToLoad,
          ['dataMarkings', 'pageInfo', 'globalCount'],
          this.props.data,
        )}
        offset={offset}
        CardComponent={<EntityDataMarkingCard history={history} />}
        DummyCardComponent={<EntityDataMarkingCardDummy />}
        nbOfCardsToLoad={nbOfCardsToLoad}
        selectAll={selectAll}
        selectedElements={selectedElements}
        onLabelClick={onLabelClick.bind(this)}
        onToggleEntity={onToggleEntity.bind(this)}
        bookmarkList={bookmarks}
      />
    );
  }
}

EntitiesDataMarkingsCards.propTypes = {
  data: PropTypes.object,
  extra: PropTypes.object,
  history: PropTypes.object,
  connectorsExport: PropTypes.array,
  relay: PropTypes.object,
  initialLoading: PropTypes.bool,
  onLabelClick: PropTypes.func,
  setNumberOfElements: PropTypes.func,
};

export const entitiesDataMarkingsCardsQuery = graphql`
  query EntitiesDataMarkingsCardsPaginationQuery(
    $search: String
    $first: Int!
    $offset: Int!
    $cursor: ID
    $orderedBy: DataMarkingOrdering
    $orderMode: OrderingMode
    $filters: [DataMarkingFiltering]
    $filterMode: FilterMode
  ) {
    ...EntitiesDataMarkingsCards_data
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
  EntitiesDataMarkingsCards,
  {
    data: graphql`
      fragment EntitiesDataMarkingsCards_data on Query
      @argumentDefinitions(
        search: { type: "String" }
        first: { type: "Int", defaultValue: 50 }
        offset: { type: "Int", defaultValue: 0 }
        cursor: { type: "ID" }
        orderedBy: { type: "DataMarkingOrdering", defaultValue: created }
        orderMode: { type: "OrderingMode", defaultValue: asc }
        filters: { type: "[DataMarkingFiltering]" }
        filterMode: { type: "FilterMode" }
      ) {
        dataMarkings(
          search: $search
          first: $first
          offset: $offset
          orderedBy: $orderedBy
          orderMode: $orderMode
          filters: $filters
          filterMode: $filterMode
        ) @connection(key: "Pagination_dataMarkings") {
          edges {
            node {
              ...EntityDataMarkingCard_node
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
      return props.data && props.data.dataMarkings;
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
    query: entitiesDataMarkingsCardsQuery,
  },
);