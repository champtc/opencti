import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose, map, assoc } from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import { withTheme, withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { QueryRenderer } from '../../../../relay/environment';
import inject18n from '../../../../components/i18n';
import ItemIcon from '../../../../components/ItemIcon';

const styles = () => ({
  container: {
    width: '100%',
    height: '100%',
  },
  paper: {
    height: '100%',
    padding: 0,
    borderRadius: 6,
  },
});

// const CyioCoreObjectVulnerabilitiesListQuery = graphql`
//   query CyioCoreObjectVulnerabilitiesListQuery(
//     $relationship_type: String!
//     $toTypes: [String]
//     $field: String!
//     $operation: StatsOperation!
//     $startDate: DateTime
//     $endDate: DateTime
//     $dateAttribute: String
//     $limit: Int
//   ) {
//     stixCoreRelationshipsDistribution(
//       relationship_type: $relationship_type
//       toTypes: $toTypes
//       field: $field
//       operation: $operation
//       startDate: $startDate
//       endDate: $endDate
//       dateAttribute: $dateAttribute
//       limit: $limit
//     ) {
//       label
//       value
//       entity {
//         ... on BasicObject {
//           entity_type
//         }
//         ... on BasicRelationship {
//           entity_type
//         }
//         ... on AttackPattern {
//           name
//           description
//         }
//         ... on Campaign {
//           name
//           description
//         }
//         ... on CourseOfAction {
//           name
//           description
//         }
//         ... on Individual {
//           name
//           description
//         }
//         ... on Organization {
//           name
//           description
//         }
//         ... on Sector {
//           name
//           description
//         }
//         ... on System {
//           name
//           description
//         }
//         ... on Indicator {
//           name
//           description
//         }
//         ... on Infrastructure {
//           name
//           description
//         }
//         ... on IntrusionSet {
//           name
//           description
//         }
//         ... on Position {
//           name
//           description
//         }
//         ... on City {
//           name
//           description
//         }
//         ... on Country {
//           name
//           description
//         }
//         ... on Region {
//           name
//           description
//         }
//         ... on Malware {
//           name
//           description
//         }
//         ... on ThreatActor {
//           name
//           description
//         }
//         ... on Tool {
//           name
//           description
//         }
//         ... on Vulnerability {
//           name
//           description
//         }
//         ... on Incident {
//           name
//           description
//         }
//       }
//     }
//   }
// `;
const cyioCoreObjectVulnerableComponentListQuery = graphql`
  query CyioCoreObjectVulnerableComponentListQuery(
    $first: Int!
    $offset: Int!
  ) {
    hardwareAssetList(
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          id
          name
          asset_type
          is_scanned
          description
        }
      }
    }
  }
`;

class CyioCoreObjectVulnerableComponentList extends Component {
  renderContent() {
    const {
      t,
      stixCoreObjectId,
      relationshipType,
      toTypes,
      field,
      startDate,
      endDate,
      dateAttribute,
      classes,
    } = this.props;
    const stixDomainObjectsDistributionVariables = {
      fromId: stixCoreObjectId,
      relationship_type: relationshipType,
      toTypes,
      field: field || 'entity_type',
      operation: 'count',
      startDate,
      endDate,
      dateAttribute,
      limit: 10,
    };
    return (
      <QueryRenderer
        query={cyioCoreObjectVulnerableComponentListQuery}
        variables={{ first: 10, offset: 0 }}
        render={({ props }) => {
          if (
            props
            // && props.stixCoreRelationshipsDistribution
            // && props.stixCoreRelationshipsDistribution.length > 0
          ) {
            // let data = props.stixCoreRelationshipsDistribution;
            // if (field === 'internal_id') {
            //   data = map(
            //     (n) => assoc(
            //       'label',
            //       `[${t(`entity_${n.entity.entity_type}`)}] ${n.entity.name}`,
            //       n,
            //     ),
            //     props.stixCoreRelationshipsDistribution,
            //   );
            // }
            return (
              <div id="container" className={classes.container}>
                <TableContainer component={Paper}>
                  <Table size="small" style={{ width: '100%' }}>
                    <TableBody>
                      {props.hardwareAssetList.edges.map((row) => (
                        <TableRow hover={true} key={row.node.name}>
                          <TableCell align="center" style={{ width: 50 }}>
                            <ItemIcon
                              type={
                                field === 'internal_id'
                                  ? row.node.entity.entity_type
                                  : 'Stix-Cyber-Observable'
                              }
                            />
                          </TableCell>
                          <TableCell align="left">
                            {field === 'internal_id'
                              ? row.node.entity.name
                              : row.node.name}
                          </TableCell>
                          <TableCell align="left">
                            {field === 'internal_id'
                              ? row.node.entity.name
                              : row.node.asset_type}
                          </TableCell>
                          <TableCell align="left">
                            {field === 'internal_id'
                              ? row.node.entity.name
                              : row.node.is_scanned}
                          </TableCell>
                          <TableCell align="right">{row.node.id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            );
          }
          if (props) {
            return (
              <div style={{ display: 'table', height: '100%', width: '100%' }}>
                <span
                  style={{
                    display: 'table-cell',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                  }}
                >
                  {t('No entities of this type has been found.')}
                </span>
              </div>
            );
          }
          return (
            <div style={{ display: 'table', height: '100%', width: '100%' }}>
              <span
                style={{
                  display: 'table-cell',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                }}
              >
                <CircularProgress size={40} thickness={2} />
              </span>
            </div>
          );
        }}
      />
    );
  }

  render() {
    const {
      t, classes, title, variant, height,
    } = this.props;
    return (
      <div style={{ height: height || '100%' }}>
        <Typography variant="h4" gutterBottom={true}>
          {title || t('Vulnerable Component')}
        </Typography>
        {variant !== 'inLine' ? (
          <Paper classes={{ root: classes.paper }} elevation={2}>
            {this.renderContent()}
          </Paper>
        ) : (
          this.renderContent()
        )}
      </div>
    );
  }
}

CyioCoreObjectVulnerableComponentList.propTypes = {
  relationshipType: PropTypes.string,
  toTypes: PropTypes.array,
  title: PropTypes.string,
  field: PropTypes.string,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
  height: PropTypes.number,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  dateAttribute: PropTypes.string,
  variant: PropTypes.string,
};

export default compose(
  inject18n,
  withTheme,
  withStyles(styles),
)(CyioCoreObjectVulnerableComponentList);
