import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { createPaginationContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { pathOr } from 'ramda';
import ListLinesContent from '../../../../components/list_lines/ListLinesContent';
import { VulnerabilityLine, VulnerabilityLineDummy } from './VulnerabilityLine';
import { setNumberOfElements } from '../../../../utils/Number';

const nbOfRowsToLoad = 50;

class VulnerabilitiesLines extends Component {
  componentDidUpdate(prevProps) {
    setNumberOfElements(
      prevProps,
      this.props,
      'vulnerabilities',
      this.props.setNumberOfElements.bind(this),
    );
  }

  render() {
    const {
      initialLoading, dataColumns, relay, onLabelClick,
    } = this.props;
    return (
      <ListLinesContent
        initialLoading={initialLoading}
        loadMore={relay.loadMore.bind(this)}
        hasMore={relay.hasMore.bind(this)}
        isLoading={relay.isLoading.bind(this)}
        dataList={pathOr([], ['vulnerabilities', 'edges'], this.props.data)}
        globalCount={pathOr(
          nbOfRowsToLoad,
          ['vulnerabilities', 'pageInfo', 'globalCount'],
          this.props.data,
        )}
        LineComponent={<VulnerabilityLine />}
        DummyLineComponent={<VulnerabilityLineDummy />}
        dataColumns={dataColumns}
        nbOfRowsToLoad={nbOfRowsToLoad}
        onLabelClick={onLabelClick.bind(this)}
      />
    );
  }
}

VulnerabilitiesLines.propTypes = {
  classes: PropTypes.object,
  paginationOptions: PropTypes.object,
  dataColumns: PropTypes.object.isRequired,
  data: PropTypes.object,
  relay: PropTypes.object,
  initialLoading: PropTypes.bool,
  onLabelClick: PropTypes.func,
  setNumberOfElements: PropTypes.func,
};

export const vulnerabilitiesLinesQuery = graphql`
  query VulnerabilitiesLinesPaginationQuery(
    $search: String
    $count: Int!
    $cursor: ID
    $orderedBy: VulnerabilityOrdering
    $orderMode: OrderingMode
    $filters: [VulnerabilityFiltering]
  ) {
    ...VulnerabilitiesLines_data
      @arguments(
        search: $search
        count: $count
        cursor: $cursor
        orderedBy: $orderedBy
        orderMode: $orderMode
        filters: $filters
      )
  }
`;

export default createPaginationContainer(
  VulnerabilitiesLines,
  {
    data: graphql`
      fragment VulnerabilitiesLines_data on Query
      @argumentDefinitions(
        search: { type: "String" }
        count: { type: "Int", defaultValue: 25 }
        cursor: { type: "ID" }
        orderedBy: { type: "VulnerabilityOrdering", defaultValue: title }
        orderMode: { type: "OrderingMode", defaultValue: asc }
        filters: { type: "[VulnerabilityFiltering]" }
      ) {
        vulnerabilities(
          search: $search
          first: $count
          # after: $cursor
          orderedBy: $orderedBy
          orderMode: $orderMode
          filters: $filters
        ) @connection(key: "Pagination_vulnerabilities") {
          edges {
            node {
              id
              title
              description
              ...VulnerabilityLine_node
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
      return props.data && props.data.vulnerabilities;
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
        count,
        cursor,
        orderBy: fragmentVariables.orderBy,
        orderMode: fragmentVariables.orderMode,
        filters: fragmentVariables.filters,
      };
    },
    query: vulnerabilitiesLinesQuery,
  },
);
