import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import {
  BarChart,
  XAxis,
  YAxis,
  Cell,
  CartesianGrid,
  Bar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { withTheme, withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { QueryRenderer } from '../../../../relay/environment';
import inject18n from '../../../../components/i18n';
import { itemColor } from '../../../../utils/Colors';
import { truncate } from '../../../../utils/String';

const styles = () => ({
  paper: {
    height: '100%',
    minHeight: 300,
    margin: '10px 0 0 0',
    padding: '1rem',
    borderRadius: 6,
  },
});

// const stixCoreObjectReportsHorizontalBarsDistributionQuery = graphql`
//   query StixCoreObjectReportsHorizontalBarsDistributionQuery(
//     $objectId: String
//     $field: String!
//     $operation: StatsOperation!
//     $limit: Int
//   ) {
//     reportsDistribution(
//       objectId: $objectId
//       field: $field
//       operation: $operation
//       limit: $limit
//     ) {
//       label
//       value
//       entity {
//         ... on Identity {
//           name
//         }
//       }
//     }
//   }
// `;

const data = [
  {
    name: 'Jan A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Jan B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Jan C',
    uv: 2000,
    pv: 3800,
    amt: 2290,
  },
  {
    name: 'Jan D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Jan E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Jan F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Jan G',
    uv: 3770,
    pv: 4300,
    amt: 2100,
  },
  {
    name: 'Jan H',
    uv: 3490,
    pv: 3300,
    amt: 2200,
  },
  {
    name: 'Jan I',
    uv: 3490,
    pv: 3500,
    amt: 2150,
  },
  {
    name: 'Jan J',
    uv: 4790,
    pv: 5300,
    amt: 2850,
  },
  {
    name: 'Jan K',
    uv: 3790,
    pv: 4600,
    amt: 2960,
  },
  {
    name: 'Jan L',
    uv: 3490,
    pv: 4700,
    amt: 4770,
  },
];

const tickFormatter = (title) => truncate(title, 10);

class CyioCoreObjectRiskActivitiesHorizontalBars extends Component {
  renderContent() {
    const {
      t, stixCoreObjectId, field, theme,
    } = this.props;
    const reportsDistributionVariables = {
      objectId: stixCoreObjectId,
      field: field || 'report_types',
      operation: 'count',
      limit: 8,
    };
    return (
      // <QueryRenderer
      //   query={stixCoreObjectReportsHorizontalBarsDistributionQuery}
      //   variables={reportsDistributionVariables}
      //   render={({ props }) => {
      //     if (
      //       props
      //       && props.reportsDistribution
      //       && props.reportsDistribution.length > 0
      //     ) {
      //       return (
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          // layout="vertical"
          // data={props.reportsDistribution}
          data={data}
          margin={{
            top: 20,
            right: 20,
            bottom: 0,
            left: 0,
          }}
          barGap={0}
        >
          <XAxis
            // type="number"
            dataKey="name"
            stroke={theme.palette.text.primary}
            // allowDecimals={false}
          />
          <YAxis
            stroke={theme.palette.text.primary}
            // dataKey={field.includes('.') ? 'entity.name' : 'label'}
            // type="category"
          // angle={-30}
          // textAnchor="end"
          // tickFormatter={tickFormatter}
          />
          <CartesianGrid
            strokeDasharray="2 2"
            stroke='rgba(241, 241, 242, 0.35)'
            // stroke={theme.palette.action.grid}
            vertical={false}
          />
          <Tooltip
            cursor={{
              fill: 'rgba(0, 0, 0, 0.2)',
              stroke: 'rgba(0, 0, 0, 0.2)',
              strokeWidth: 2,
            }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              fontSize: 12,
              borderRadius: 10,
            }}
          />
          <Bar
            // fill={theme.palette.primary.main}
            dataKey="amt"
            fill="#075AD3"
            barSize={20}
          />
          <Bar
            // fill={theme.palette.primary.main}
            dataKey="uv"
            fill="#83ADE9"
            barSize={20}
          />
          <Bar
            // fill={theme.palette.primary.main}
            dataKey="pv"
            fill="#FFFFFF"
            barSize={20}
          />
          {/* {props.reportsDistribution.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={itemColor(entry.entity.name)}
              />
            ))} */}
          {/* {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                // fill={itemColor(entry.name)}
              />
            ))}
          </Bar> */}
        </BarChart>
      </ResponsiveContainer>
      //       );
      //     }
      //     if (props) {
      //       return (
      //         <div style={{ display: 'table', height: '100%', width: '100%' }}>
      //           <span
      //             style={{
      //               display: 'table-cell',
      //               verticalAlign: 'middle',
      //               textAlign: 'center',
      //             }}
      //           >
      //             {t('No entities of this type has been found.')}
      //           </span>
      //         </div>
      //       );
      //     }
      //     return (
      //       <div style={{ display: 'table', height: '100%', width: '100%' }}>
      //         <span
      //           style={{
      //             display: 'table-cell',
      //             verticalAlign: 'middle',
      //             textAlign: 'center',
      //           }}
      //         >
      //           <CircularProgress size={40} thickness={2} />
      //         </span>
      //       </div>
      //     );
      //   }}
      // />
    );
  }

  render() {
    const {
      t, classes, title, variant, height,
    } = this.props;
    return (
      <div style={{ height: height || '100%' }}>
        <Typography variant="h4" gutterBottom={true}>
          {title || t('Risk Activities')}
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

CyioCoreObjectRiskActivitiesHorizontalBars.propTypes = {
  stixCoreObjectId: PropTypes.string,
  title: PropTypes.string,
  field: PropTypes.string,
  theme: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

export default compose(
  inject18n,
  withTheme,
  withStyles(styles),
)(CyioCoreObjectRiskActivitiesHorizontalBars);
