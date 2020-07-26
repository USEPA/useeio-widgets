import * as React from "react";
import * as ReactDOM from "react-dom";

import { Widget, Config } from "../../widget";
import { Model } from "../../webapi";
import { ListHeader } from "./list-header";

export class IOList extends Widget {

    config: Config;

    constructor(
        private model: Model,
        private direction: "inputs" | "outputs",
        private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        this.config = config;
        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this.selector));
    }

}

const Component = (props: { widget: IOList }) => {

    const [config, setConfig] = React.useState<Config>({
        ...props.widget.config
    });

    return (
        <>
            <table>
                <thead>
                    <tr className="indicator-row">
                        <ListHeader
                            config={config}
                            sectorCount={0}
                            onConfigChange={newConfig => setConfig(
                                { ...config, ...newConfig })}
                            onSearch={_term => { }}
                        />
                    </tr>
                </thead>
            </table>
        </>
    );
};