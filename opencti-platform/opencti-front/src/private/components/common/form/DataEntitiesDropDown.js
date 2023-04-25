import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import {
  compose,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import inject18n from '../../../../components/i18n';
import responsiblePartiesIcon from '../../../../resources/images/entities/responsible_parties.svg';
import tasksIcon from '../../../../resources/images/entities/tasks.svg';
import locations from '../../../../resources/images/entities/locations.svg';
import roles from '../../../../resources/images/entities/roles.svg';
import labels from '../../../../resources/images/entities/labelsImage.svg';
import notes from '../../../../resources/images/entities/Notes.svg';
import parties from '../../../../resources/images/entities/parties.svg';
import assessmentPlatform from '../../../../resources/images/entities/assessment_platform.svg';
import externalReferenceIcon from '../../../../resources/images/entities/externalReferenceIcon.svg';
import userTypesIcon from '../../../../resources/images/entities/user_types.svg';
import leveragedAuthorizationIcon from '../../../../resources/images/entities/leveragedAuthorizationIcon.svg';
import informationTypesIcon from '../../../../resources/images/entities/information_types.svg';
import dataMarkingsIcon from '../../../../resources/images/entities/data_markings.svg';

const styles = () => ({
  dataEntities: {
    width: 'auto',
    minWidth: '180px',
  },
  menuItems: {
    display: 'flex',
    placeItems: 'center',
  },
  menuItemText: {
    width: '100%',
    paddingLeft: '10px',
  },
  iconsContainer: {
    minWidth: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
});

class DataEntitiesDropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      assetTypes: {},
    };
  }

  render() {
    const {
      t,
      classes,
      selectedDataEntity,
    } = this.props;

    return (
      <FormControl
        size="small"
        fullWidth={true}
        variant="outlined"
        className={classes.dataEntities}
      >
        <InputLabel>Data Types</InputLabel>
        <Select
          variant="outlined"
          value={selectedDataEntity}
          label="Data Types"
        >
          <MenuItem
            component={Link}
            to="/data/entities/responsibility"
            value="responsibility"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={roles} alt="" />
              </div>
              <div className={classes.menuItemText}>{t('Responsibility')}</div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/locations"
            value="locations"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={locations} alt="" />
              </div>
              <div className={classes.menuItemText}>{t('Locations')}</div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/parties"
            value="parties"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={parties} alt="" />
              </div>
              <div className={classes.menuItemText}>{t('Parties')}</div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/responsible_parties"
            value="responsible_parties"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={responsiblePartiesIcon} alt="" />
              </div>
              <div className={classes.menuItemText}>
                {t('Responsible Parties')}
              </div>
            </div>
          </MenuItem>
          <MenuItem component={Link} to="/data/entities/tasks" value="tasks">
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={tasksIcon} alt="" />
              </div>
              <div className={classes.menuItemText}>{t('Tasks')}</div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/assessment_platform"
            value="assessment_platform"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={assessmentPlatform} alt="" />
              </div>
              <div className={classes.menuItemText}>
                {t('Assessment Platform')}
              </div>
            </div>
          </MenuItem>
          <MenuItem component={Link} to="/data/entities/notes" value="notes">
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={notes} alt="" />
              </div>
              <div className={classes.menuItemText}>{t('Notes')}</div>
            </div>
          </MenuItem>
          <MenuItem component={Link} to="/data/entities/labels" value="labels">
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={labels} alt="" />
              </div>
              <div className={classes.menuItemText}>{t('Labels')}</div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/external_references"
            value="external_references"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={externalReferenceIcon} alt="" />
              </div>
              <div className={classes.menuItemText}>
                {t('External References')}
              </div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/user_types"
            value="user_types"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={userTypesIcon} alt="" />
              </div>
              <div className={classes.menuItemText}>
                {t('User Types')}
              </div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/leveraged_authorizations"
            value="leveraged_authorizations"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={leveragedAuthorizationIcon} alt="" />
              </div>
              <div className={classes.menuItemText}>
                {t('Leveraged Authorizations')}
              </div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/information_types"
            value="information_types"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={informationTypesIcon} alt="" />
              </div>
              <div className={classes.menuItemText}>
                {t('Information Types')}
              </div>
            </div>
          </MenuItem>
          <MenuItem
            component={Link}
            to="/data/entities/data_markings"
            value="data_markings"
          >
            <div className={classes.menuItems}>
              <div className={classes.iconsContainer}>
                <img src={dataMarkingsIcon} alt="" />
              </div>
              <div className={classes.menuItemText}>
                {t('Data Markings')}
              </div>
            </div>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }
}
export default compose(inject18n, withRouter, withStyles(styles))(DataEntitiesDropDown);
