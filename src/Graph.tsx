import React, { Component } from 'react';
import { Table, TableData } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';
import { timeStamp } from 'console';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
    load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
    table: Table | undefined;

    render() {
        return React.createElement('perspective-viewer');
    }

    componentDidMount() {
        // Get element from the DOM.
        const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

        /* 
        Modifying the 'schema' object:
            - Adding the 'ratio' field to track two stocks ratios
            - Tracking 'upper-bound', 'lower-bound', and 'trigger-alert' when the bounds are crossed
            - Adding 'price-abc' and 'price-def' to calculate the ratio of the stocks
            - Adding 'timestamp' to track the time of the data
        */
        const schema = {
            price_abc: 'float',
            price_def: 'float',
            ratio: 'float',
            timestamp: 'date',
            upper_bound: 'float',
            lower_bound: 'float',
            trigger_alert: 'float',
        };

        if (window.perspective && window.perspective.worker()) {
            this.table = window.perspective.worker().table(schema);
        }

        // Modifying the attributes to the element based on the schema
        if (this.table) {
            // Load the `table` in the `<perspective-viewer>` DOM reference.
            elem.load(this.table);
            elem.setAttribute('view', 'y_line');        // The kind of graph we want ot visualize the data with
            // elem.setAttribute('column-pivots', '["stock"]);      // Removed this because we're concerned about the ratios between stocks and not their separated prices
            elem.setAttribute('row-pivots', '["timestamp"]');       // Allows us to map each datapoint based on its timestamp
            // Focuses on a particular part of a datapoint's data along the y-axis
            elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
            // Allows to handle the duplicate data and consolidate them to a single data point
            elem.setAttribute('aggregates', JSON.stringify({
                price_abc: 'avg',
                price_def: 'avg',
                ratio: 'avg',
                timestamp: 'distinct count',
                upper_bound: 'avg',
                lower_bound: 'avg',
                trigger_alert: 'avg',
            }));
        }
    }

    componentDidUpdate() {
        if (this.table) {
            // Another 'component lifecycle method' to be executed when
            // component, i.e. the graph, is updated with new data
            this.table.update([
                DataManipulator.generateRow(this.props.data),
            ] as unknown as TableData);
        }
    }
}

export default Graph;
