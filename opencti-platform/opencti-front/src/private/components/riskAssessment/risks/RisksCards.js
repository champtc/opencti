/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { createPaginationContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { pathOr } from 'ramda';
import CyioListCardsContent from '../../../../components/list_cards/CyioListCardsContent';
import { RiskCard, RiskCardDummy } from './RiskCard';
import { setNumberOfElements } from '../../../../utils/Number';
import StixDomainObjectBookmarks, {
  stixDomainObjectBookmarksQuery,
} from '../../common/stix_domain_objects/StixDomainObjectBookmarks';
import { QueryRenderer } from '../../../../relay/environment';

const nbOfCardsToLoad = 50;

class RisksCards extends Component {
  constructor(props) {
    super(props);
    this.state = { bookmarks: [], offset: 0 };
  }

  componentDidUpdate(prevProps) {
    setNumberOfElements(
      prevProps,
      this.props,
      'poamItems',
      this.props.setNumberOfElements.bind(this),
    );
  }

  handleSetBookmarkList(bookmarks) {
    this.setState({ bookmarks });
  }

  handleOffsetChange(){
    const incrementedOffset = this.state.offset += nbOfCardsToLoad;
    this.setState({ offset:incrementedOffset })
    this.props.relay.refetchConnection(nbOfCardsToLoad, null, {
      offset: this.state.offset,
      first: nbOfCardsToLoad,
    })
  }

  render() {
    const {
      initialLoading,
      relay,
      selectAll,
      onLabelClick,
      onToggleEntity,
      selectedElements,
    } = this.props;
    const { bookmarks, offset } = this.state;
    return (
    // <QueryRenderer
    //   query={stixDomainObjectBookmarksQuery}
    //   variables={{ types: ['Device'] }}
    //   render={({ props }) => (
    //     <div>
    //       <StixDomainObjectBookmarks
    //         data={props}
    //         onLabelClick={onLabelClick.bind(this)}
    //         setBookmarkList={this.handleSetBookmarkList.bind(this)}
    //       />
            <CyioListCardsContent
              initialLoading={initialLoading}
              loadMore={this.handleOffsetChange.bind(this)}
              hasMore={relay.hasMore.bind(this)}
              isLoading={relay.isLoading.bind(this)}
              dataList={pathOr([], ['poamItems', 'edges'], this.props.data)}
              globalCount={pathOr(
                nbOfCardsToLoad,
                ['poamItems', 'pageInfo', 'globalCount'],
                this.props.data,
              )}
              offset={offset}
              CardComponent={<RiskCard />}
              DummyCardComponent={<RiskCardDummy />}
              nbOfCardsToLoad={nbOfCardsToLoad}
              selectAll={selectAll}
              selectedElements={selectedElements}
              onLabelClick={onLabelClick.bind(this)}
              onToggleEntity={onToggleEntity.bind(this)}
              bookmarkList={bookmarks}
            />
    //     </div>
    //   )}
    // />
    );
  }
}

RisksCards.propTypes = {
  data: PropTypes.object,
  extra: PropTypes.object,
  connectorsExport: PropTypes.array,
  relay: PropTypes.object,
  initialLoading: PropTypes.bool,
  onLabelClick: PropTypes.func,
  setNumberOfElements: PropTypes.func,
};

export const risksCardsQuery = graphql`
  query RisksCardsPaginationQuery(
    $search: String
    $first: Int!
    $offset: Int!
    $cursor: ID
    $orderedBy: POAMItemsOrdering
    $orderMode: OrderingMode
    $filters: [POAMItemsFiltering]
  ) {
    ...RisksCards_data
      @arguments(
        search: $search
        first: $first
        offset: $offset
        cursor: $cursor
        orderedBy: $orderedBy
        orderMode: $orderMode
        filters: $filters
      )
  }
`;

export default createPaginationContainer(
  RisksCards,
  {
    data: graphql`
      fragment RisksCards_data on Query
      @argumentDefinitions(
        search: { type: "String" }
        first: { type: "Int", defaultValue: 50 }
        offset: { type: "Int", defaultValue: 0 }
        cursor: { type: "ID" }
        orderedBy: { type: "POAMItemsOrdering", defaultValue: poam_id }
        orderMode: { type: "OrderingMode", defaultValue: asc }
        filters: { type: "[POAMItemsFiltering]" }
      ) {
        poamItems(
          search: $search
          first: $first
          offset: $offset
          # after: $cursor
          orderedBy: $orderedBy
          orderMode: $orderMode
          filters: $filters
        ) @connection(key: "Pagination_poamItems") {
          edges {
            node {
              id
              name
              description
              ...RiskCard_node
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
      return props.data && props.data.poamItems;
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
      };
    },
    query: risksCardsQuery,
  },
);