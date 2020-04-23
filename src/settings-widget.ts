import * as d3 from "d3";
import { Widget, Config } from "./commons";

export function on(conf: { selector: string }): SettingsWidget {
    return new SettingsWidget(conf.selector);
}

export class SettingsWidget extends Widget {

    private selector: string;

    constructor(selector: string) {
        super();
        this.selector = selector;
        this.ready();
    }

    async handleUpdate(config: Config) {

    }

}