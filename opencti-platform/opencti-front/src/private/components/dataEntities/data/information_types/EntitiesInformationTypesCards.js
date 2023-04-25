/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { createPaginationContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { pathOr } from 'ramda';
import CyioListCardsContent from '../../../../../components/list_cards/CyioListCardsContent';
import { setNumberOfElements } from '../../../../../utils/Number';
import { EntityInformationTypeCard, EntityInformationTypeCardDummy } from './EntityInformationTypeCard';

const nbOfCardsToLoad = 50;

class EntitiesInformationTypesCards extends Component {
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
      'informationType',
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
        dataList={pathOr([], ['informationTypes', 'edges'], this.props.data)}
        globalCount={pathOr(
          nbOfCardsToLoad,
          ['informationTypes', 'pageInfo', 'globalCount'],
          this.props.data,
        )}
        offset={offset}
        CardComponent={<EntityInformationTypeCard history={history} />}
        DummyCardComponent={<EntityInformationTypeCardDummy />}
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

EntitiesInformationTypesCards.propTypes = {
  data: PropTypes.object,
  extra: PropTypes.object,
  history: PropTypes.object,
  connectorsExport: PropTypes.array,
  relay: PropTypes.object,
  initialLoading: PropTypes.bool,
  onLabelClick: PropTypes.func,
  setNumberOfElements: PropTypes.func,
};

export const entitiesInformationTypesCardsQuery = graphql`
  query EntitiesInformationTypesCardsPaginationQuery(
    $search: String
    $first: Int!
    $offset: Int!
    $cursor: ID
    $orderedBy: InformationTypeOrdering
    $orderMode: OrderingMode
    $filters: [InformationTypeFiltering]
    $filterMode: FilterMode
  ) {
    ...EntitiesInformationTypesCards_data
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
  EntitiesInformationTypesCards,
  {
    data: graphql`
      fragment EntitiesInformationTypesCards_data on Query
      @argumentDefinitions(
        search: { type: "String" }
        first: { type: "Int", defaultValue: 50 }
        offset: { type: "Int", defaultValue: 0 }
        cursor: { type: "ID" }
        orderedBy: { type: "InformationTypeOrdering", defaultValue: created }
        orderMode: { type: "OrderingMode", defaultValue: asc }
        filters: { type: "[InformationTypeFiltering]" }
        filterMode: { type: "FilterMode" }
      ) {
        informationTypes(
          search: $search
          first: $first
          offset: $offset
          orderedBy: $orderedBy
          orderMode: $orderMode
          filters: $filters
          filterMode: $filterMode
        ) @connection(key: "Pagination_informationTypes") {
          edges {
            node {
              id
              title
              ...EntityInformationTypeCard_node
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
      return props.data && props.data.informationTypes;
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
    query: entitiesInformationTypesCardsQuery,
  },
);
