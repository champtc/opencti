import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import * as R from 'ramda';
import { QueryRenderer } from '../../../relay/environment';
import {
  buildViewParamsFromUrlAndStorage,
  convertFilters,
  saveViewParameters,
} from '../../../utils/ListParameters';
import inject18n from '../../../components/i18n';
import CyioListCards from '../../../components/list_cards/CyioListCards';
import CyioListLines from '../../../components/list_lines/CyioListLines';
import { isUniqFilter } from '../common/lists/Filters';
import { toastGenericError } from '../../../utils/bakedToast';
import AssessmentsCards, { assessmentsCardsQuery } from './assessmentsResults/AssessmentsCards';
import AssessmentsLines, { assessmentsLinesQuery } from './assessmentsResults/AssessmentsLines';

class Assessments extends Component {
  constructor(props) {
    super(props);
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      'view-assessments',
    );
    this.state = {
      sortBy: R.propOr('poam_id', 'sortBy', params),
      orderAsc: R.propOr(true, 'orderAsc', params),
      searchTerm: R.propOr('', 'searchTerm', params),
      view: R.propOr('lines', 'view', params),
      filters: R.propOr({}, 'filters', params),
      openExports: false,
      numberOfElements: { number: 0, symbol: '' },
      selectedElements: null,
      selectAll: false,
      openRiskCreation: false,
    };
  }

  saveView() {
    this.handleRefresh();
    saveViewParameters(
      this.props.history,
      this.props.location,
      'view-assessments',
      this.state,
    );
  }

  componentWillUnmount() {
    const {
      sortBy,
      orderAsc,
      openAssessmentCreation,
    } = this.state;
    const paginationOptions = {
      sortBy,
      orderAsc,
      filters: [],
      openAssessmentCreation,
    };
    if (this.props.history.location.pathname !== '/activities/assessments/assessment_results'
      && convertFilters(this.state.filters).length) {
      saveViewParameters(
        this.props.history,
        this.props.location,
        'view-assessments',
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

  handleRiskCreation() {
    this.setState({ openRiskCreation: true });
  }

  handleRefresh() {
    this.props.history.push('/activities/assessments/assessment_results');
  }

  handleDisplayEdit(selectedElements) {
    const riskId = Object.entries(selectedElements)[0][1].id;
    this.props.history.push({
      pathname: `/activities/assessments/assessment_results/${riskId}`,
      openEdit: true,
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
        }, () => this.saveView(),
      );
    } else {
      this.setState(
        {
          filters: R.assoc(key, [{ id, value }], this.state.filters),
        }, () => this.saveView(),
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
    const dataColumns = {
      poam_id: {
        label: 'POAM ID',
      },
      name: {
        label: 'Name',
      },
      created: {
        label: 'Creation date',
      },
      modified: {
        label: 'Modification date',
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
        handleClearSelectedElements={this.handleClearSelectedElements.bind(this)}
        handleNewCreation={this.handleRiskCreation.bind(this)}
        handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        selectedElements={selectedElements}
        selectAll={selectAll}
        disabled={true}
        // CreateItemComponent={<RiskCreation />}
        // OperationsComponent={<RiskDeletion />}
        openExports={openExports}
        filterEntityType="Risk"
        keyword={searchTerm}
        filters={filters}
        paginationOptions={paginationOptions}
        numberOfElements={numberOfElements}
        availableFilterKeys={[
          'name_m',
          'risk_level',
          'risk_status',
          'response_type',
          'deadline_start_date',
          'created_start_date',
          'created_end_date',
          'label_name',
        ]}
      >
        <QueryRenderer
          query={assessmentsCardsQuery}
          variables={{ first: 50, offset: 0, ...paginationOptions }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Request Failed');
            }
            return (
              <AssessmentsCards
                data={props}
                extra={props}
                selectAll={selectAll}
                history={this.props.history}
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
    const dataColumns = {
      poam_id: {
        label: 'POAM ID',
        width: '9%',
        isSortable: true,
      },
      name: {
        label: 'Name',
        width: '16%',
        isSortable: true,
      },
      risk_level: {
        label: 'Severity',
        width: '11%',
        isSortable: true,
      },
      risk_status: {
        label: 'Status',
        width: '10%',
        isSortable: true,
      },
      response_type: {
        label: 'Response',
        width: '10%',
        isSortable: true,
      },
      lifecycle: {
        label: 'Lifecycle',
        width: '18%',
        isSortable: true,
      },
      occurrences: {
        label: 'Occurrences',
        width: '12%',
        isSortable: true,
      },
      deadline: {
        label: 'Deadline',
        width: '7%',
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
        handleClearSelectedElements={this.handleClearSelectedElements.bind(this)}
        handleNewCreation={this.handleRiskCreation.bind(this)}
        handleDisplayEdit={this.handleDisplayEdit.bind(this)}
        selectedElements={selectedElements}
        // CreateItemComponent={<RiskCreation />}
        // OperationsComponent={<RiskDeletion />}
        openExports={openExports}
        selectAll={selectAll}
        disabled={true}
        filterEntityType="Risk"
        keyword={searchTerm}
        filters={filters}
        paginationOptions={paginationOptions}
        numberOfElements={numberOfElements}
        availableFilterKeys={[
          'name_m',
          'risk_level',
          'risk_status',
          'response_type',
          'deadline_start_date',
          'created_start_date',
          'created_end_date',
          'label_name',
        ]}
      >
        <QueryRenderer
          query={assessmentsLinesQuery}
          variables={{ first: 50, offset: 0, ...paginationOptions }}
          render={({ error, props }) => {
            if (error) {
              toastGenericError('Request Failed');
            }
            return (
              <AssessmentsLines
                data={props}
                selectAll={selectAll}
                dataColumns={dataColumns}
                history={this.props.history}
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
      view,
      sortBy,
      orderAsc,
      searchTerm,
      filters,
      openRiskCreation,
    } = this.state;
    const finalFilters = convertFilters(filters);
    const paginationOptions = {
      search: searchTerm,
      orderedBy: sortBy,
      orderMode: orderAsc ? 'asc' : 'desc',
      filters: finalFilters,
      filterMode: 'and',
    };
    const { location } = this.props;
    return (
      <div>
        {view === 'cards' && (!openRiskCreation && !location.openNewCreation) ? this.renderCards(paginationOptions) : ''}
        {view === 'lines' && (!openRiskCreation && !location.openNewCreation) ? this.renderLines(paginationOptions) : ''}
        {((openRiskCreation || location.openNewCreation) && (
          // <Security needs={[KNOWLEDGE_KNUPDATE]}>
          {/*

          <RiskCreation paginationOptions={paginationOptions} history={this.props.history} /> */}
          // </Security>
        ))}
      </div>
    );
  }
}

Assessments.propTypes = {
  t: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
};

export default R.compose(inject18n, withRouter)(Assessments);