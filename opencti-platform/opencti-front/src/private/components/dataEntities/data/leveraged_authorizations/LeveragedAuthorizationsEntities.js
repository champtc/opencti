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
import EntitiesLeveragedAuthorizationsCards, {
  entitiesLeveragedAuthorizationsCardsQuery,
} from './EntitiesLeveragedAuthorizationsCards';
import EntitiesLeveragedAuthorizationsLines, {
  entitiesLeveragedAuthorizationsLinesQuery,
} from './EntitiesLeveragedAuthorizationsLines';
import { isUniqFilter } from '../../../common/lists/Filters';
import { toastGenericError } from '../../../../../utils/bakedToast';
import EntitiesLeveragedAuthorizationsCreation from './EntitiesLeveragedAuthorizationsCreation';
import EntitiesLeveragedAuthorizationsDeletion from './EntitiesLeveragedAuthorizationsDeletion';
import LeveragedAuthorizationEntityEdition from './LeveragedAuthorizationEntityEdition';

class LeveragedAuthorizationsEntities extends Component {
  constructor(props) {
    super(props);
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      'view-leveragedAuthorizations',
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
      selectedLeveragedAuthorizationId: '',
    };
  }

  saveView() {
    this.handleRefresh();
    saveViewParameters(
      this.props.history,
      this.props.location,
      'view-leveragedAuthorizations',
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
      this.props.history.location.pathname !== '/data/entities/leveraged_authorizations'
      && convertFilters(this.state.filters).length
    ) {
      saveViewParameters(
        this.props.history,
        this.props.location,
        'view-leveragedAuthorizations',
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

  handleLeveragedAuthorizationCreation() {
    this.setState({ openDataCreation: !this.state.openDataCreation });
  }

  handleRefresh() {
    this.props.history.push('/data/entities/leveraged_authorizations');
  }

  handleDisplayEdit(selectedElements) {
    let id = '';
    if (selectedElements) {
      id = Object.entries(selectedElements)[0][1]?.id;
    }
    this.setState({
      displayEdit: !this.state.displayEdit,
      selectedLeveragedAuthorizationId: id,
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
      party: {
        label: 'Party',
      },
      date_Authorized: {
        label: 'Date Authorized ',
      },
      labels: {
        label: 'Labels',
      },
      marking: {
        label: 'Marking',
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
        handleNewCreation={this.handleLeveragedAuthorizationCreation.bind(this)}
        handleClearSelectedElements={this.handleClearSelectedElements.bind(
          this,
        )}
        handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        selectedElements={selectedElements}
        selectAll={selectAll}
        CreateItemComponent={<EntitiesLeveragedAuthorizationsCreation />}
        OperationsComponent={<EntitiesLeveragedAuthorizationsDeletion />}
        openExports={openExports}
        filterEntityType="Entities"
        selectedDataEntity="leveraged_authorizations"
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
          query={entitiesLeveragedAuthorizationsCardsQuery}
          variables={{ first: 50, offset: 0, ...paginationOptions }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Request Failed');
            }
            return (
              <EntitiesLeveragedAuthorizationsCards
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
      party: {
        label: 'Party',
        width: '16%',
        isSortable: false,
      },
      date_authorized: {
        label: 'Date Authorized',
        width: '12%',
        isSortable: true,
      },
      labels: {
        label: 'Labels',
        width: '20%',
        isSortable: true,
      },
      marking: {
        label: 'Marking',
        width: '12%',
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
        handleNewCreation={this.handleLeveragedAuthorizationCreation.bind(this)}
        handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        selectedElements={selectedElements}
        CreateItemComponent={<EntitiesLeveragedAuthorizationsCreation />}
        OperationsComponent={<EntitiesLeveragedAuthorizationsDeletion />}
        openExports={openExports}
        selectAll={selectAll}
        filterEntityType="Entities"
        selectedDataEntity="leveraged_authorizations"
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
          query={entitiesLeveragedAuthorizationsLinesQuery}
          variables={{ first: 50, offset: 0, ...paginationOptions }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Request Failed');
            }
            return (
              <EntitiesLeveragedAuthorizationsLines
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
        <EntitiesLeveragedAuthorizationsCreation
          openDataCreation={openDataCreation}
          handleLeveragedAuthorizationCreation={this.handleLeveragedAuthorizationCreation.bind(
            this,
          )}
          history={this.props.history}
        />
        {this.state.selectedLeveragedAuthorizationId && (
          <LeveragedAuthorizationEntityEdition
            displayEdit={this.state.displayEdit}
            history={this.props.history}
            leveragedAuthorizationId={this.state.selectedLeveragedAuthorizationId}
            handleDisplayEdit={this.handleDisplayEdit.bind(this)}
          />
        )}
      </div>
    );
  }
}

LeveragedAuthorizationsEntities.propTypes = {
  t: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
};

export default R.compose(
  inject18n,
  withRouter,
)(LeveragedAuthorizationsEntities);
