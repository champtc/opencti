/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { Information } from 'mdi-material-ui';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import graphql from 'babel-plugin-relay/macro';
import IconButton from '@material-ui/core/IconButton';
import inject18n from '../../../../components/i18n';
import { toastGenericError } from '../../../../utils/bakedToast';
import { QueryRenderer, commitMutation } from '../../../../relay/environment';
import InformationTypeEdition, {
  InformationTypeEditionQuery,
} from './InformationTypeEdition';
import RiskLevel from '../../common/form/RiskLevel';
import InformationTypesCreationPopover from './InformationTypesCreationPopover';

const styles = (theme) => ({
  dialogMain: {
    overflow: 'hidden',
  },
  dialogClosebutton: {
    float: 'left',
    marginLeft: '15px',
    marginBottom: '20px',
  },
  dialogTitle: {
    padding: '24px 0 16px 24px',
  },
  dialogActions: {
    justifyContent: 'flex-start',
    padding: '10px 0 20px 22px',
  },
  dialogContent: {
    padding: '0 24px',
    marginBottom: '24px',
    overflowY: 'scroll',
    height: '650px',
  },
  buttonPopover: {
    textTransform: 'capitalize',
  },
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
    height: '78px',
    overflow: 'hidden',
    overflowY: 'scroll',
  },
  scrollObj: {
    color: theme.palette.header.text,
    fontFamily: 'sans-serif',
    padding: '0px',
    textAlign: 'left',
    display: 'grid',
    gridTemplateColumns: '40% 1fr 1fr 1fr',
  },
  popoverDialog: {
    fontSize: '18px',
    lineHeight: '24px',
    color: theme.palette.header.text,
  },
  textBase: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 5,
  },
});

const informationTypesDeleteMutation = graphql`
  mutation InformationTypesCreationDeleteMutation(
    $id: ID!
  ) {
    deleteInformationType(id: $id)
  }
`;

class InformationTypesCreationComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      openEdit: false,
      selectedProduct: {},
      informationTypeId: '',
    };
  }

  handleEditInfoType(informationTypeId) {
    if (informationTypeId) {
      this.setState({ informationTypeId: informationTypeId });
    }
    this.setState({ openEdit: !this.state.openEdit });
  }

  handleDeleteInfoType(infoTypeId) {
    commitMutation({
      mutation: informationTypesDeleteMutation,
      variables: {
        id: infoTypeId,
      },
      setSubmitting,
      pathname: '/defender_hq/assets/information_systems',
      onCompleted: (data) => {
        setSubmitting(false);
        resetForm();
      },
      onError: (err) => {
        console.error(err);
        toastGenericError('Failed to delete Information Type');
      },
    });
  }

  handleChangeDialog() {
    this.setState({ open: !this.state.open });
  }

  render() {
    const { t, classes, informationSystem } = this.props;
    const {
      open,
      openEdit,
      selectedProduct,
      informationTypeId,
    } = this.state;
    const informationTypes = R.pathOr({}, ['information_types'], informationSystem);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant='h3' color='textSecondary' gutterBottom={true}>
            {t('Information Type(s)')}
          </Typography>
          <div style={{ float: 'left', margin: '5px 0 0 5px' }}>
            <Tooltip title={t('Identifies the details about all information types that are stored, processed, or transmitted by the system, such as privacy information, and those defined in NIST SP 800-60.')}>
              <Information style={{ marginLeft: '5px' }} fontSize='inherit' color='disabled' />
            </Tooltip>
          </div>
          <IconButton
            size='small'
            onClick={this.handleChangeDialog.bind(this)}
          >
            <AddIcon />
          </IconButton>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '40% 1fr 1fr 1fr', padding: '10px' }}>
          <Typography>
            {t('Name')}
          </Typography>
          <Typography>
            {t('Confidentiality')}
          </Typography>
          <Typography>
            {t('Integrity')}
          </Typography>
          <Typography>
            {t('Availability')}
          </Typography>
        </div>
        <div className={classes.scrollBg}>
          <div className={classes.scrollDiv}>
            <div className={classes.scrollObj}>
              {informationTypes && informationTypes.map((informationType, key) => (
                <div key={key}>
                  <div>{informationType.title && t(informationType.title)}</div>
                  <div>{informationType.confidentiality_impact && <RiskLevel risk={informationType.confidentiality_impact.base_impact} />}</div>
                  <div>{informationType.integrity_impact && <RiskLevel risk={informationType.integrity_impact.base_impact} />}</div>
                  <div>
                    <div style={{ display: 'flex' }}>
                      {informationType.availability_impact && <RiskLevel risk={informationType.availability_impact.base_impact} />}
                      <IconButton size='small' onClick={this.handleEditInfoType.bind(this, informationType.id)}>
                        <EditIcon fontSize='small' />
                      </IconButton>
                      <IconButton size='small' onClick={this.handleDeleteInfoType.bind(this, informationType.id)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <InformationTypesCreationPopover
          open={open}
          handleChangeDialog={this.handleChangeDialog.bind(this)}
        />
        {informationTypeId && (
          <QueryRenderer
            query={InformationTypeEditionQuery}
            variables={{ id: informationTypeId }}
            render={({ props, retry }) => {
              if (props) {
                return (
                  <InformationTypeEdition
                    openEdit={openEdit}
                    informationType={props.informationType}
                    handleEditInfoType={this.handleEditInfoType.bind(this)}
                  />
                );
              }
              return (
                <div style={{ height: '100%' }}>
                </div>
              );
            }}
          />
        )}
      </div>
    );
  }
}

InformationTypesCreationComponent.propTypes = {
  t: PropTypes.func,
  name: PropTypes.string,
  classes: PropTypes.object,
  informationSystem: PropTypes.object,
};

const InformationTypesCreation = createFragmentContainer(InformationTypesCreationComponent, {
  informationSystem: graphql`
    fragment InformationTypesCreation_information on InformationSystem {
      id
      information_types {
        id
        title
        confidentiality_impact {
          base_impact
        }
        integrity_impact {
          base_impact
        }
        availability_impact {
          base_impact   
        }
      }
    }
  `,
});

export default compose(inject18n, withStyles(styles))(InformationTypesCreation);
