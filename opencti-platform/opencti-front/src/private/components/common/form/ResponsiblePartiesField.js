/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  compose,
  map,
  pipe,
  pathOr,
  uniq,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
import AddIcon from '@material-ui/icons/Add';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import graphql from 'babel-plugin-relay/macro';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import LaunchIcon from '@material-ui/icons/Launch';
import IconButton from '@material-ui/core/IconButton';
import {
  Dialog, DialogContent, DialogActions,
} from '@material-ui/core';
import inject18n from '../../../../components/i18n';
import { commitMutation, fetchQuery } from '../../../../relay/environment';

const styles = (theme) => ({
  scrollBg: {
    background: theme.palette.header.background,
    width: '100%',
    color: 'white',
    padding: '10px 5px 10px 15px',
    borderRadius: '5px',
    lineHeight: '20px',
  },
  scrollDiv: {
    width: '100%',
    background: theme.palette.header.background,
    height: '85px',
    overflow: 'hidden',
    overflowY: 'scroll',
  },
  scrollObj: {
    color: theme.palette.header.text,
    fontFamily: 'sans-serif',
    padding: '0px',
    textAlign: 'left',
  },
  descriptionBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleIcon: {
    display: 'flex',
  },
  launchIcon: {
    marginRight: '10px',
  },
  dialogAction: {
    margin: '15px 20px 15px 0',
  },
  addIcon: {
    marginRight: '-10px',
    padding: '5px',
  },
  linkTitle: {
    color: '#fff',
    minWidth: 'fit-content',
    fontSize: '12px',
  },
});

const responsiblePartiesFieldQuery = graphql`
  query ResponsiblePartiesFieldQuery(
    $orderedBy: OscalResponsiblePartyOrdering
    $orderMode: OrderingMode
  ){
    oscalResponsibleParties(
      orderedBy: $orderedBy
      orderMode: $orderMode
    ) {
      edges {
        node {
          id
          created
          name
        }
      }
    }
  }
`;

const responsiblePartiesFieldAddMutation = graphql`
  mutation ResponsiblePartiesFieldAddMutation(
    $fieldName: String!
    $fromId: ID!
    $toId: ID!
    $to_type: String
    $from_type: String
  ) {
    addReference(input: {field_name: $fieldName, from_id: $fromId, to_id: $toId, to_type: $to_type, from_type: $from_type})
  }
`;

const responsiblePartiesAttachToInformationMutation = graphql`
  mutation ResponsiblePartiesFieldAttachToInformationMutation(
    $id: ID!
    $entityId: ID!
    $field: String!
  ) {
    attachToInformationSystem(id: $id, entityId: $entityId, field: $field) 
  }
`;

const responsiblePartiesDetachToInformationMutation = graphql`
  mutation ResponsiblePartiesFieldDetachToInformationMutation(
    $id: ID!
    $entityId: ID!
    $field: String!
  ) {
    detachFromInformationSystem(id: $id, entityId: $entityId, field: $field) 
  }
`;

const responsiblePartiesFieldRemoveMutation = graphql`
  mutation ResponsiblePartiesFieldRemoveMutation(
    $fieldName: String!
    $fromId: ID!
    $toId: ID!
    $to_type: String
    $from_type: String
  ) {
    removeReference(input: {field_name: $fieldName, from_id: $fromId, to_id: $toId, to_type: $to_type, from_type: $from_type})
  }
`;

class ResponsiblePartiesField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: false,
      parties: [],
      currentParties: this.props.data ? [...this.props.data] : [],
      party: null,
    };
  }

  componentDidMount() {
    fetchQuery(responsiblePartiesFieldQuery, {
      orderedBy: 'name',
      orderMode: 'asc',
    })
      .toPromise()
      .then((data) => {
        const transformLabels = pipe(
          pathOr([], ['oscalResponsibleParties', 'edges']),
          map((n) => ({
            name: n.node.name,
            id: n.node.id,
          })),
        )(data);
        this.setState({ parties: [...transformLabels] });
      });
  }

  handleAdd() {
    this.setState({
      currentParties: uniq([...this.state.currentParties, this.state.party]),
      open: false,
    });
    if (this.props.entityType === 'informationSystem') {
      commitMutation({
        mutation: responsiblePartiesAttachToInformationMutation,
        variables: {
          id: this.props.id,
          entityId: this.state.party?.id,
          field: this.props.name,
        },
      });
    } else {
      commitMutation({
        mutation: responsiblePartiesFieldAddMutation,
        variables: {
          toId: this.state.party?.id,
          fromId: this.props.id,
          fieldName: this.props.name,
          from_type: this.props.fromType,
          to_type: this.props.toType,
        }
      });
    }
  }

  handleDelete(id) {
    if (this.props.entityType === 'informationSystem') {
      commitMutation({
        mutation: responsiblePartiesDetachToInformationMutation,
        variables: {
          id: this.props.id,
          entityId: id,
          field: this.props.name,
        },
        onCompleted: () => {
          const newParties = this.state.currentParties.filter((item) => item.id !== id);
          this.setState({
            open: false,
            currentParties: newParties,
          });
        },
      });
    } else {
      commitMutation({
        mutation: responsiblePartiesFieldRemoveMutation,
        variables: {
          toId: id,
          fromId: this.props.id,
          fieldName: this.props.name,
          from_type: this.props.fromType,
          to_type: this.props.toType,
        },
        onCompleted: () => {
          const newParties = this.state.currentParties.filter((item) => item.id !== id);
          this.setState({
            open: false,
            currentParties: newParties,
          });
        },
      });
    }
  }

  render() {
    const {
      t,
      history,
      classes,
      title,
      disabled,
    } = this.props;

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h3" color="textSecondary" gutterBottom={true}>{title && t(title)}</Typography>
          <div style={{ float: 'left', margin: '5px 0 0 5px' }}>
            <Tooltip title={t('Responsible Parties')}>
              <Information fontSize="inherit" color="disabled" />
            </Tooltip>
          </div>
          <IconButton
            size="small"
            onClick={() => this.setState({ open: true })}
            disabled={disabled ?? false}
          >
            <InsertLinkIcon />
          </IconButton>
        </div>
        <div className={classes.scrollBg}>
          <div className={classes.scrollDiv}>
            <div className={classes.scrollObj}>
              {this.state.currentParties
                && this.state.currentParties.map((party, key) => (
                  <div key={key} className={classes.descriptionBox}>
                    <div className={classes.titleIcon}>
                      <Link
                        key={key}
                        component="button"
                        variant="body2"
                        onClick={() => history.push(`/data/entities/responsible_parties/${party.id}`)}
                      >
                        <LaunchIcon fontSize="small" className={classes.launchIcon} />
                      </Link>
                      <div className={classes.linkTitle}>{party && t(party?.name)}</div>
                    </div>
                    <IconButton
                      size="small"
                      onClick={this.handleDelete.bind(this, party.id)}
                    >
                      <LinkOffIcon />
                    </IconButton>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <Dialog
          keepMounted={false}
          open={this.state.open}
          fullWidth={true}
          maxWidth='sm'
        >
          <DialogContent>{title && t(title)}</DialogContent>
          <DialogContent style={{ overflow: 'hidden' }}>
            <Autocomplete
              size='small'
              loading={this.state.parties === []}
              loadingText='Searching...'
              className={classes.autocomplete}
              classes={{
                popupIndicatorOpen: classes.popupIndicator,
              }}
              noOptionsText={t('No available options')}
              options={this.state.parties}
              getOptionLabel={(option) => (option.name ? option.name : option)}
              onChange={(event, value) => this.setState({ party: value })}
              selectOnFocus={true}
              autoHighlight={true}
              forcePopupIcon={true}
              renderInput={(params) => (
                <TextField
                  variant='outlined'
                  {...params}
                  label='Choose Responsible Party'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <IconButton disabled aria-label="open" size="large" className={classes.addIcon}>
                          <AddIcon />
                        </IconButton>
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </DialogContent>
          <DialogActions className={classes.dialogAction}>
            <Button
              variant='outlined'
              onClick={() => this.setState({ open: false, party: null })}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant='contained'
              onClick={this.handleAdd.bind(this)}
              color='primary'
              disabled={this.state.party === null}
            >
              {t('Add')}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

ResponsiblePartiesField.propTypes = {
  t: PropTypes.func,
  id: PropTypes.string,
  data: PropTypes.array,
  name: PropTypes.string,
  title: PropTypes.string,
  toType: PropTypes.string,
  device: PropTypes.object,
  classes: PropTypes.object,
  fromType: PropTypes.string,
  entityType: PropTypes.string,
};

export default compose(inject18n, withStyles(styles))(ResponsiblePartiesField);
