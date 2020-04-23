import * as d3 from "d3";
import { Widget, Config, ResultPerspective } from "./commons";

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
        d3.select(this.selector)
            .selectAll("*")
            .remove();

        const self = this;
        const perspective = config.perspective
            ? config.perspective
            : "direct";

        const row = d3.select(this.selector)
            .append("div")
            .classed("settings-row", true);
        row.append("label")
            .classed("settings-label", true)
            .text("Perspective");
        const combo = row.append("select")
            .attr("value", perspective === "direct" ? 1 : 2)
            .on("change", function () {
                self.fireChange({
                    perspective: this.value as ResultPerspective,
                });
            });
        combo.append("option")
            .attr("value", "direct")
            .property("selected", perspective === "direct")
            .text("Suppy chain");
        combo.append("option")
            .attr("value", "upstream")
            .property("selected", perspective === "upstream")
            .text("Point of consumption");

    }

}