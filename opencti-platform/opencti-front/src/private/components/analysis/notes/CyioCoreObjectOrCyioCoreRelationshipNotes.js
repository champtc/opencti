import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { QueryRenderer as QR } from 'react-relay';
import Paper from '@material-ui/core/Paper';
import DarkLightEnvironment from '../../../../relay/environmentDarkLight';
import inject18n from '../../../../components/i18n';
import CyioCoreObjectNotesCards, {
// cyioCoreObjectNotesCardsQuery,
} from './CyioCoreObjectNotesCards';
import StixCoreRelationshipNotesCards, {
  stixCoreRelationshipNotesCardsQuery,
} from './StixCoreRelationshipNotesCards';
import { QueryRenderer } from '../../../../relay/environment';

class CyioCoreObjectOrCyioCoreRelationshipNotes extends Component {
  render() {
    const {
      t,
      cyioCoreObjectOrCyioCoreRelationshipId,
      isRelationship,
      marginTop,
      height,
      typename,
      notes,
    } = this.props;
    if (isRelationship) {
      return (
        <QueryRenderer
          query={stixCoreRelationshipNotesCardsQuery}
          variables={{ id: cyioCoreObjectOrCyioCoreRelationshipId, count: 200 }}
          render={({ props }) => {
            if (props) {
              return (
                <StixCoreRelationshipNotesCards
                  stixCoreRelationshipId={
                    cyioCoreObjectOrCyioCoreRelationshipId
                  }
                  data={props}
                  marginTop={marginTop}
                />
              );
            }
            return (
              <div style={{ height: '100%', marginTop: marginTop || 40 }}>
                <Typography
                  variant="h4"
                  gutterBottom={true}
                  style={{ float: 'left' }}
                >
                  {t('Notes')}
                </Typography>
              </div>
            );
          }}
        />
      );
    }
    return (
      <>
        <CyioCoreObjectNotesCards
          cyioCoreObjectId={cyioCoreObjectOrCyioCoreRelationshipId}
          data={notes}
          height={height}
          typename={typename}
          marginTop={marginTop}
        />
      </>
    );
  }
}

CyioCoreObjectOrCyioCoreRelationshipNotes.propTypes = {
  notes: PropTypes.array,
  typename: PropTypes.string,
  t: PropTypes.func,
  cyioCoreObjectOrCyioCoreRelationshipId: PropTypes.string,
  isRelationship: PropTypes.bool,
  marginTop: PropTypes.number,
  height: PropTypes.number,
};

export default inject18n(CyioCoreObjectOrCyioCoreRelationshipNotes);
