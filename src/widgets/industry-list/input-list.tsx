import * as React from "react";
import * as ReactDOM from "react-dom";

import { Widget, Config } from "../../widget";
import { Model } from "../../webapi";

export class InputList extends Widget {

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this.selector));
    }

}

const Component = (props: { widget: InputList }) => {
    return <></>;
};