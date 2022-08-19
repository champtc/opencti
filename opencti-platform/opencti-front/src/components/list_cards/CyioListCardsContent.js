/* eslint-disable no-underscore-dangle */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import {
  AutoSizer,
  ColumnSizer,
  InfiniteLoader,
  Grid,
  WindowScroller,
} from 'react-virtualized';
import inject18n from '../i18n';

const numberOfCardsPerLine = 3;

const styles = () => ({
  windowScrollerWrapper: {
    flex: '1 1 auto',
  },
  defaultCard: {
    padding: '0 15px 30px 15px',
  },
});

class CyioListCardsContent extends Component {
  constructor(props) {
    super(props);
    this._isCellLoaded = this._isCellLoaded.bind(this);
    this._loadMoreRows = this._loadMoreRows.bind(this);
    this._onSectionRendered = this._onSectionRendered.bind(this);
    this._cellRenderer = this._cellRenderer.bind(this);
    this._setRef = this._setRef.bind(this);
    this._resetLoadingCardCount = this._resetLoadingCardCount.bind(this);
    this.gridRef = React.createRef();
    this.state = {
      scrollValue: 0,
      loadedData: 0,
      loadingCardCount: 0,
      newDataList: [],
    };
  }

  componentDidUpdate(prevProps) {
    const diff = R.symmetricDifferenceWith(
      (x, y) => x.node.id === y.node.id,
      this.state.newDataList,
      prevProps.dataList,
    );
    const diffBookmark = R.symmetricDifferenceWith(
      (x, y) => x.node.id === y.node.id,
      this.props.bookmarkList || [],
      prevProps.bookmarkList || [],
    );
    let selection = false;
    if (
      Object.keys(this.props.selectedElements || {}).length
      !== Object.keys(prevProps.selectedElements || {}).length
    ) {
      selection = true;
    }
    if (this.props.selectAll !== prevProps.selectAll) {
      selection = true;
    }
    if (diff.length > 0 || diffBookmark.length > 0 || selection) {
      this.gridRef.forceUpdate();
    }
    const checker = (arr, target) => target.every((v) => arr.includes(v));
    if (!checker(this.state.newDataList, this.props.dataList)
      && (this.state.loadingCardCount === 0 || this.props.offset !== 0)) {
      this.setState({
        newDataList: [...this.props.dataList, ...this.state.newDataList],
        loadedData: this.state.loadedData - this.props.dataList.length,
      });
    }
    if (window.pageYOffset < 40 && this.state.newDataList.length > 50
      && this.props.offset > 0) {
      window.scrollTo(0, 3000);
      this.props.handleDecrementedOffsetChange();
      this.setState({ newDataList: this.state.newDataList.slice(-50) });
    }
    if (this.state.loadedData !== (this.props.dataList.length + this.props.offset)
      && ((this.props.globalCount - this.state.loadedData) > 0)
      && (this.state.loadingCardCount !== 0 || this.props.offset === 0)) {
      if (this.props.dataList.length === 0) {
        this.setState({ newDataList: [] });
        this.listRef.forceUpdateGrid();
      }
      if (!checker(this.state.newDataList, this.props.dataList)) {
        this.setState({
          newDataList: [...this.state.newDataList, ...this.props.dataList],
          loadedData: this.state.loadedData + this.props.dataList.length,
        });
      }
    }
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  handleScroll(event) {
    this.setState({ scrollValue: window.pageYOffset });
  }

  _setRef(windowScroller) {
    // noinspection JSUnusedGlobalSymbols
    this._windowScroller = windowScroller;
  }

  _resetLoadingCardCount() {
    this.setState({ loadingCardCount: 0 });
  }

  _loadMoreRows() {
    const {
      loadMore,
      hasMore,
      isLoading,
      globalCount,
      handleIncrementedOffsetChange,
      nbOfCardsToLoad,
    } = this.props;
    if (!hasMore() || isLoading()) {
      return;
    }
    const difference = globalCount - this.state.newDataList.length;
    this.setState({
      loadingCardCount:
        difference >= nbOfCardsToLoad ? nbOfCardsToLoad : difference,
    });
    handleIncrementedOffsetChange();
    loadMore(nbOfCardsToLoad, this._resetLoadingCardCount);
    if (this.state.newDataList.length > 50 && difference > 0) {
      setTimeout(() => {
        this.setState({ newDataList: this.state.newDataList.slice(50) });
        window.scrollTo(0, 4000);
      }, 500);
    }
  }

  _onSectionRendered({
    columnStartIndex,
    columnStopIndex,
    rowStartIndex,
    rowStopIndex,
  }) {
    const startIndex = rowStartIndex * numberOfCardsPerLine + columnStartIndex;
    const stopIndex = rowStopIndex * numberOfCardsPerLine + columnStopIndex;
    this._onRowsRendered({
      startIndex,
      stopIndex,
    });
  }

  _isCellLoaded({ index }) {
    return !this.props.hasMore() || index < this.state.newDataList.length;
  }

  _cellRenderer({
    columnIndex, key, rowIndex, style,
  }) {
    const {
      classes,
      selectAll,
      bookmarkList,
      CardComponent,
      onToggleEntity,
      selectedElements,
      DummyCardComponent,
      initialLoading,
      onLabelClick,
    } = this.props;
    const bookmarksIds = R.map((n) => n.node.id, bookmarkList || []);
    const index = rowIndex * numberOfCardsPerLine + columnIndex;
    const className = classes.defaultCard;
    if (initialLoading || !this._isCellLoaded({ index })) {
      return (
        <div className={className} key={key} style={style}>
          {React.cloneElement(DummyCardComponent)}
        </div>
      );
    }
    const edge = this.state.newDataList[index];
    if (!edge) {
      return (
        <div key={key} style={style}>
          &nbsp;
        </div>
      );
    }
    const { node } = edge;
    return (
      <div className={className} key={key} style={style}>
        {React.cloneElement(CardComponent, {
          node,
          selectAll,
          bookmarksIds,
          onLabelClick,
          onToggleEntity,
          selectedElements,
        })}
      </div>
    );
  }

  render() {
    const {
      globalCount,
      initialLoading,
      isLoading,
      nbOfCardsToLoad,
      rowHeight,
    } = this.props;
    const nbLineForCards = Math.ceil(this.state.newDataList.length / numberOfCardsPerLine);
    const nbOfLinesToLoad = Math.ceil(nbOfCardsToLoad / numberOfCardsPerLine);
    const nbLinesWithLoading = isLoading()
      ? nbLineForCards + this.state.loadingCardCount
      : nbLineForCards;
    const rowCount = initialLoading ? nbOfLinesToLoad : nbLinesWithLoading;
    return (
      <WindowScroller ref={this._setRef} scrollElement={window}>
        {({
          height, isScrolling, onChildScroll, scrollTop,
        }) => (
          <div className={styles.windowScrollerWrapper}>
            <InfiniteLoader
              isRowLoaded={this._isCellLoaded}
              loadMoreRows={this._loadMoreRows}
              rowCount={globalCount}
            >
              {({ onRowsRendered, registerChild }) => {
                this._onRowsRendered = onRowsRendered;
                return (
                  <AutoSizer disableHeight>
                    {({ width }) => (
                      <ColumnSizer
                        columnCount={numberOfCardsPerLine}
                        width={width}
                      >
                        {({ adjustedWidth, getColumnWidth }) => {
                          const columnWidth = getColumnWidth();
                          return (
                            <Grid
                              ref={(ref) => {
                                this.gridRef = ref;
                                registerChild(ref);
                              }}
                              autoHeight={true}
                              height={height}
                              onRowsRendered={onRowsRendered}
                              isScrolling={isScrolling}
                              onScroll={onChildScroll}
                              columnWidth={columnWidth}
                              columnCount={numberOfCardsPerLine}
                              rowHeight={rowHeight || 345}
                              overscanColumnCount={numberOfCardsPerLine}
                              overscanRowCount={2}
                              rowCount={rowCount}
                              cellRenderer={this._cellRenderer}
                              onSectionRendered={this._onSectionRendered}
                              scrollToIndex={-1}
                              scrollTop={scrollTop}
                              width={adjustedWidth}
                            />
                          );
                        }}
                      </ColumnSizer>
                    )}
                  </AutoSizer>
                );
              }}
            </InfiniteLoader>
          </div>
        )}
      </WindowScroller>
    );
  }
}

CyioListCardsContent.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  initialLoading: PropTypes.bool,
  loadMore: PropTypes.func,
  hasMore: PropTypes.func,
  isLoading: PropTypes.func,
  handleIncrementedOffsetChange: PropTypes.func,
  handleDecrementedOffsetChange: PropTypes.func,
  bookmarkList: PropTypes.array,
  offset: PropTypes.number,
  globalCount: PropTypes.number,
  CardComponent: PropTypes.object,
  onToggleEntity: PropTypes.func,
  DummyCardComponent: PropTypes.object,
  selectedElements: PropTypes.object,
  nbOfCardsToLoad: PropTypes.number,
  selectAll: PropTypes.bool,
  width: PropTypes.number,
  rowHeight: PropTypes.number,
  onLabelClick: PropTypes.func,
};

export default R.compose(inject18n, withStyles(styles))(CyioListCardsContent);
