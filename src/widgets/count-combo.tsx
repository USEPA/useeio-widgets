import * as React from "react";
import * as ReactDOM from "react-dom";

import { Config, Widget } from "../";
import { Model } from "../webapi";

export class CountCombo extends Widget {

    constructor(private model: Model, private selector: string) {
        super();
        ReactDOM.render(
            <Combo count={-1} widget={this} />,
            document.querySelector(selector));
    }

    async update(config: Config) {
        const count = config.count || -1;
        ReactDOM.render(
            <Combo count={count} widget={this} />,
            document.querySelector(this.selector));
    }
}

type ComboProps = {
    count: number,
    widget: Widget;
};

const Combo = (props: ComboProps) => {
    const options = [-1, 10, 20, 30, 40, 50, 100].map(i => {
        const text = i === -1 ? "" : i;
        return (
            <option value={i} key={`count-prop-${i}`}>
                {text}
            </option>
        );
    });
    return (
        <select value={props.count} onChange={(e) => {
            const count = parseInt(e.target.value, 10);
            props.widget.fireChange({ count });
        }}>
            {options}
        </select>
    );
};
