/* eslint-disable */
/* refactor */
import React, { Component } from 'react';
import { Field } from 'formik';
import * as R from 'ramda';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import { Information } from 'mdi-material-ui';
import graphql from 'babel-plugin-relay/macro'
import inject18n from '../../../../components/i18n';
import SelectField from '../../../../components/SelectField';
import { fetchDarklightQuery } from '../../../../relay/environmentDarkLight';

const LoggedByQuery = graphql`
 query LoggedByQuery {
  oscalParties {
    edges {
      node {
        name
        description
      }
    }
  }
}
`;

class RelatedResponse extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedByList: [],
        }
    }
    componentDidMount() {
        fetchDarklightQuery(LoggedByQuery)
            .toPromise()
            .then((data) => {
                const loggedByEntities = R.pipe(
                    R.pathOr([], ['oscalParties', 'edges']),
                    R.map((n) => ({
                        label: n.node.description,
                        value: n.node.name,
                    })),
                )(data);
                this.setState({
                    loggedByList: {
                        ...this.state.entities,
                        loggedByEntities
                    },
                });
            })
    }

    render() {
        const {
            t,
            name,
            size,
            label,
            style,
            variant,
            onChange,
            onFocus,
            containerstyle,
            editContext,
            disabled,
            helperText,
        } = this.props;
        const loggedByList = R.pathOr(
            [],
            ['loggedByEntities'],
            this.state.loggedByList,
        );
        return (
            <div>
                <div className="clearfix" />
                <Field
                    component={SelectField}
                    name={name}
                    label={label}
                    fullWidth={true}
                    containerstyle={containerstyle}
                    variant={variant}
                    disabled={disabled || false}
                    size={size}
                    style={style}
                    helperText={helperText}
                >
                    {loggedByList.map((resp, key) => (
                        <MenuItem key={resp.value} value={resp.value}>
                            {resp.value}
                        </MenuItem>
                    ))}
                </Field>
            </div>
        );
    }
}

export default inject18n(RelatedResponse);
