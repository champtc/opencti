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
import Chip from '@material-ui/core/Chip';
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
  Dialog, DialogContent, DialogActions, DialogTitle,
} from '@material-ui/core';
import inject18n from '../../../../components/i18n';
import { commitMutation, fetchQuery } from '../../../../relay/environment';
import { toastGenericError } from '../../../../utils/bakedToast';

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

const dataMarkingsFieldQuery = graphql`
  query DataMarkingsFieldQuery(
    $orderedBy: DataMarkingOrdering
    $orderMode: OrderingMode
  ){
    dataMarkings(
      orderedBy: $orderedBy
      orderMode: $orderMode
    ) {
      edges {
        node {
        ... on StatementMarking {
                id
                name
                color
            }
        ... on TLPMarking {
                id
                color
                name
            }
        ... on IEPMarking {
                id
                color
                name
            }
        }
      }
    }
  }
`;


class DataMarkingsField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: false,
      markings: [],
      currentMarkings: this.props.data ? [...this.props.data] : [],
      marking: null,
    };
  }

  componentDidMount() {
    fetchQuery(dataMarkingsFieldQuery, {
      orderedBy: 'name',
      orderMode: 'asc',
    })
      .toPromise()
      .then((data) => {
        const transformLabels = pipe(
          pathOr([], ['dataMarkings', 'edges']),
          map((n) => ({
            name: n.node.name,
            id: n.node.id,
            color: n.node.color,
          })),
        )(data);
        this.setState({ markings: [...transformLabels] });
      });
  }

  handleAdd() {
    this.setState({
      currentMarkings: uniq([...this.state.currentMarkings, this.state.marking]),
      open: false,
    });
    commitMutation({
        mutation: this.props.attachTo,
        variables: {
          id: this.props.id,
          entityId: this.state.marking?.id,
          field: this.props.name,
        },
        onError: () => {
            toastGenericError('Failed to attach data markings');
          },
      });
  }

  handleDelete(id) {
    commitMutation({
        mutation: this.props.detachTo,
        variables: {
          id: this.props.id,
          entityId: id,
          field: this.props.name,
        },
        onCompleted: () => {
          const newMarkings = this.state.currentMarkings.filter((item) => item.id !== id);
          this.setState({
            open: false,
            currentMarkings: newMarkings,
          });
        },
        onError: () => {
            toastGenericError('Failed to detach data markings');
          },
      });
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
            <Tooltip title={t(title ?? 'Data Markings')}>
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
              {this.state.currentMarkings
                && this.state.currentMarkings.map((marking, key) => (
                  <div key={key} className={classes.descriptionBox}>
                    <div className={classes.titleIcon}>
                        <Chip style={{
                            backgroundColor: marking.color, borderRadius: 0, padding: 10, color: '#000',
                            }} size="small" label={marking.name} 
                        />
                    </div>
                    <IconButton
                      size="small"
                      onClick={this.handleDelete.bind(this, marking.id)}
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
          <DialogTitle>{title && t(title)}</DialogTitle>
          <DialogContent style={{ overflow: 'hidden' }}>
            <Autocomplete
              size='small'
              loading={this.state.markings === []}
              loadingText='Searching...'
              className={classes.autocomplete}
              classes={{
                popupIndicatorOpen: classes.popupIndicator,
              }}
              noOptionsText={t('No available options')}
              options={this.state.markings}
              getOptionLabel={(option) => (option.name ? option.name : option)}
              onChange={(event, value) => this.setState({ marking: value })}
              selectOnFocus={true}
              autoHighlight={true}
              forcePopupIcon={true}
              renderInput={(params) => (
                <TextField
                  variant='outlined'
                  {...params}
                  label='Choose Markings'
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
              onClick={() => this.setState({ open: false, marking: null })}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant='contained'
              onClick={this.handleAdd.bind(this)}
              color='primary'
              disabled={this.state.marking === null}
            >
              {t('Add')}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

DataMarkingsField.propTypes = {
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

export default compose(inject18n, withStyles(styles))(DataMarkingsField);
