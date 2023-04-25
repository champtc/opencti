import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import * as R from 'ramda';
import { QueryRenderer } from '../../../../../relay/environment';
import {
  buildViewParamsFromUrlAndStorage,
  convertFilters,
  saveViewParameters,
} from '../../../../../utils/ListParameters';
import inject18n from '../../../../../components/i18n';
import CyioListCards from '../../../../../components/list_cards/CyioListCards';
import CyioListLines from '../../../../../components/list_lines/CyioListLines';
import { isUniqFilter } from '../../../common/lists/Filters';
import { toastGenericError } from '../../../../../utils/bakedToast';
import EntitiesDataMarkingsCreation from './EntitiesDataMarkingsCreation';
import EntitiesDataMarkingsDeletion from './EntitiesDataMarkingsDeletion';
import EntitiesDataMarkingsCards, { entitiesDataMarkingsCardsQuery } from './EntitiesDataMarkingsCards';
import EntitiesDataMarkingsLines, { entitiesDataMarkingsLinesQuery } from './EntitiesDataMarkingsLines';
import DataMarkingEntityEdition from './DataMarkingEntityEdition';

class DataMarkingsEntities extends Component {
  constructor(props) {
    super(props);
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      'view-dataMarkings',
    );
    this.state = {
      sortBy: R.propOr('name', 'sortBy', params),
      orderAsc: R.propOr(true, 'orderAsc', params),
      searchTerm: R.propOr('', 'searchTerm', params),
      view: R.propOr('cards', 'view', params),
      filters: R.propOr({}, 'filters', params),
      openExports: false,
      numberOfElements: { number: 0, symbol: '' },
      selectedElements: null,
      selectAll: false,
      openDataCreation: false,
      displayEdit: false,
      selectedDataMarkingId: '',
    };
  }

  saveView() {
    this.handleRefresh();
    saveViewParameters(
      this.props.history,
      this.props.location,
      'view-dataMarkings',
      this.state,
    );
  }

  componentWillUnmount() {
    const { sortBy, orderAsc } = this.state;
    const paginationOptions = {
      sortBy,
      orderAsc,
      filters: [],
    };
    if (
      this.props.history.location.pathname !== '/data/entities/data_markings'
      && convertFilters(this.state.filters).length
    ) {
      saveViewParameters(
        this.props.history,
        this.props.location,
        'view-dataMarkings',
        paginationOptions,
      );
    }
  }

  handleChangeView(mode) {
    this.setState({ view: mode }, () => this.saveView());
  }

  handleSearch(value) {
    this.setState({ searchTerm: value }, () => this.saveView());
  }

  handleSort(field, orderAsc) {
    this.setState({ sortBy: field, orderAsc }, () => this.saveView());
  }

  handleToggleExports() {
    this.setState({ openExports: !this.state.openExports });
  }

  handleToggleSelectAll() {
    this.setState({ selectAll: !this.state.selectAll, selectedElements: null });
  }

  handleClearSelectedElements() {
    this.setState({ selectAll: false, selectedElements: null });
  }

  handleDataMarkingCreation() {
    this.setState({ openDataCreation: !this.state.openDataCreation });
  }

  handleRefresh() {
    this.props.history.push('/data/entities/data_markings');
  }

  handleDisplayEdit(selectedElements) {
    let id = '';
    if (selectedElements) {
      id = Object.entries(selectedElements)[0][1]?.id;
    }
    this.setState({
      displayEdit: !this.state.displayEdit,
      selectedDataMarkingId: id,
    });
  }

  handleToggleSelectEntity(entity, event) {
    event.stopPropagation();
    event.preventDefault();
    const { selectedElements } = this.state;
    if (entity.id in (selectedElements || {})) {
      const newSelectedElements = R.omit([entity.id], selectedElements);
      this.setState({
        selectAll: false,
        selectedElements: newSelectedElements,
      });
    } else {
      const newSelectedElements = R.assoc(
        entity.id,
        entity,
        selectedElements || {},
      );
      this.setState({
        selectAll: false,
        selectedElements: newSelectedElements,
      });
    }
  }

  handleAddFilter(key, id, value, event = null) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.state.filters[key] && this.state.filters[key].length > 0) {
      this.setState(
        {
          filters: R.assoc(
            key,
            isUniqFilter(key)
              ? [{ id, value }]
              : R.uniqBy(R.prop('id'), [
                { id, value },
                ...this.state.filters[key],
              ]),
            this.state.filters,
          ),
        },
        () => this.saveView(),
      );
    } else {
      this.setState(
        {
          filters: R.assoc(key, [{ id, value }], this.state.filters),
        },
        () => this.saveView(),
      );
    }
  }

  handleRemoveFilter(key) {
    this.setState({ filters: R.dissoc(key, this.state.filters) }, () => this.saveView());
  }

  setNumberOfElements(numberOfElements) {
    this.setState({ numberOfElements });
  }

  renderCards(paginationOptions) {
    const {
      sortBy,
      orderAsc,
      searchTerm,
      filters,
      openExports,
      numberOfElements,
      selectedElements,
      selectAll,
    } = this.state;
    const { history } = this.props;
    const dataColumns = {
      type: {
        label: 'Type',
      },
      name: {
        label: 'Name',
      },
      description: {
        label: 'Description',
      },
      created: {
        label: 'Creation Date',
      },
    };
    return (
      <CyioListCards
        sortBy={sortBy}
        orderAsc={orderAsc}
        dataColumns={dataColumns}
        handleSort={this.handleSort.bind(this)}
        handleSearch={this.handleSearch.bind(this)}
        handleChangeView={this.handleChangeView.bind(this)}
        handleAddFilter={this.handleAddFilter.bind(this)}
        handleRemoveFilter={this.handleRemoveFilter.bind(this)}
        handleToggleExports={this.handleToggleExports.bind(this)}
        handleNewCreation={this.handleDataMarkingCreation.bind(this)}
        handleClearSelectedElements={this.handleClearSelectedElements.bind(
          this,
        )}
        handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        selectedElements={selectedElements}
        selectAll={selectAll}
        CreateItemComponent={<EntitiesDataMarkingsCreation />}
        OperationsComponent={<EntitiesDataMarkingsDeletion />}
        openExports={openExports}
        filterEntityType="Entities"
        selectedDataEntity="data_markings"
        keyword={searchTerm}
        filters={filters}
        paginationOptions={paginationOptions}
        numberOfElements={numberOfElements}
        availableFilterKeys={[
          'created_start_date',
          'created_end_date',
          'label_name',
        ]}
      >
        <QueryRenderer
          query={entitiesDataMarkingsCardsQuery}
          variables={{ first: 50, offset: 0, ...paginationOptions }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Request Failed');
            }
            return (
              <EntitiesDataMarkingsCards
                data={props}
                extra={props}
                history={history}
                selectAll={selectAll}
                paginationOptions={paginationOptions}
                initialLoading={props === null}
                selectedElements={selectedElements}
                onLabelClick={this.handleAddFilter.bind(this)}
                setNumberOfElements={this.setNumberOfElements.bind(this)}
                onToggleEntity={this.handleToggleSelectEntity.bind(this)}
              />
            );
          }}
        />
      </CyioListCards>
    );
  }

  renderLines(paginationOptions) {
    const {
      sortBy,
      filters,
      orderAsc,
      selectAll,
      searchTerm,
      openExports,
      selectedElements,
      numberOfElements,
    } = this.state;
    const { history } = this.props;
    const dataColumns = {
      type: {
        label: 'Type',
        width: '14%',
        isSortable: false,
      },
      name: {
        label: 'Name',
        width: '16%',
        isSortable: true,
      },
      description: {
        label: 'Description',
        width: '30%',
        isSortable: false,
      },
      created: {
        label: 'Creation Date',
        width: '20%',
        isSortable: true,
      },
    };
    return (
      <CyioListLines
        sortBy={sortBy}
        orderAsc={orderAsc}
        dataColumns={dataColumns}
        handleSort={this.handleSort.bind(this)}
        handleSearch={this.handleSearch.bind(this)}
        handleChangeView={this.handleChangeView.bind(this)}
        handleAddFilter={this.handleAddFilter.bind(this)}
        handleRemoveFilter={this.handleRemoveFilter.bind(this)}
        handleToggleExports={this.handleToggleExports.bind(this)}
        handleToggleSelectAll={this.handleToggleSelectAll.bind(this)}
        handleClearSelectedElements={this.handleClearSelectedElements.bind(
          this,
        )}
        handleNewCreation={this.handleDataMarkingCreation.bind(this)}
        handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        selectedElements={selectedElements}
        CreateItemComponent={<EntitiesDataMarkingsCreation />}
        OperationsComponent={<EntitiesDataMarkingsDeletion />}
        openExports={openExports}
        selectAll={selectAll}
        filterEntityType="Entities"
        selectedDataEntity="data_markings"
        keyword={searchTerm}
        filters={filters}
        paginationOptions={paginationOptions}
        numberOfElements={numberOfElements}
        availableFilterKeys={[
          'created_start_date',
          'created_end_date',
          'label_name',
        ]}
      >
        <QueryRenderer
          query={entitiesDataMarkingsLinesQuery}
          variables={{ first: 50, offset: 0, ...paginationOptions }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Request Failed');
            }
            return (
              <EntitiesDataMarkingsLines
                data={props}
                history={history}
                selectAll={selectAll}
                dataColumns={dataColumns}
                initialLoading={props === null}
                selectedElements={selectedElements}
                paginationOptions={paginationOptions}
                onLabelClick={this.handleAddFilter.bind(this)}
                onToggleEntity={this.handleToggleSelectEntity.bind(this)}
                setNumberOfElements={this.setNumberOfElements.bind(this)}
              />
            );
          }}
        />
      </CyioListLines>
    );
  }

  render() {
    const {
      view, sortBy, orderAsc, searchTerm, filters, openDataCreation,
    } = this.state;
    const finalFilters = convertFilters(filters);
    const paginationOptions = {
      search: searchTerm,
      orderedBy: sortBy,
      orderMode: orderAsc ? 'asc' : 'desc',
      filters: finalFilters,
      filterMode: 'and',
    };
    return (
      <div>
        {view === 'cards' && this.renderCards(paginationOptions)}
        {view === 'lines' && this.renderLines(paginationOptions)}
        <EntitiesDataMarkingsCreation
          openDataCreation={openDataCreation}
          handleDataMarkingCreation={this.handleDataMarkingCreation.bind(
            this,
          )}
          history={this.props.history}
        />
        {this.state.selectedDataMarkingId && (
          <DataMarkingEntityEdition
            displayEdit={this.state.displayEdit}
            history={this.props.history}
            dataMarkingId={this.state.selectedDataMarkingId}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
          />
        )}
      </div>
    );
  }
}

DataMarkingsEntities.propTypes = {
  t: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
};

export default R.compose(
  inject18n,
  withRouter,
)(DataMarkingsEntities);
