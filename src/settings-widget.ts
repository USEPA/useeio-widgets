import * as d3 from "d3";
import { Widget, Config, ResultPerspective, DemandType } from "./commons";

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
        this.perspectiveRow(config);
        this.analysisTypeRow(config);
    }

    private perspectiveRow(config: Config) {
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

        // combo box with event handler
        const combo = row.append("select")
            .attr("value", perspective)
            .on("change", function () {
                self.fireChange({
                    perspective: this.value as ResultPerspective,
                });
            });

        // append options
        combo.append("option")
            .attr("value", "direct")
            .property("selected", perspective === "direct")
            .text("Suppy chain");
        combo.append("option")
            .attr("value", "upstream")
            .property("selected", perspective === "upstream")
            .text("Point of consumption");
    }

    private analysisTypeRow(config: Config) {
        const self = this;
        const type = config.analysis
            ? config.analysis
            : "consumption";

        const row = d3.select(this.selector)
            .append("div")
            .classed("settings-row", true);
        row.append("label")
            .classed("settings-label", true)
            .text("Analysis type");

        // combo box with event handler
        const combo = row.append("select")
            .attr("value", type)
            .on("change", function () {
                self.fireChange({
                    analysis: this.value as DemandType,
                });
            });

        // append options
        combo.append("option")
            .attr("value", "consumption")
            .property("selected", type === "consumption")
            .text("Consumption");
        combo.append("option")
            .attr("value", "production")
            .property("selected", type === "production")
            .text("Production");
    }

}