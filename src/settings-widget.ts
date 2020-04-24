import * as d3 from "d3";
import { Widget, Config } from "./commons";
import { ResultPerspective, DemandType } from "./webapi";

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
        const perspective: ResultPerspective = config.perspective
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
            .attr("value", "final")
            .property("selected", perspective === "final")
            .text("Point of consumption");
    }

    private analysisTypeRow(config: Config) {
        const self = this;
        const type: DemandType = config.analysis
            ? config.analysis
            : "Consumption";

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
            .attr("value", "Consumption")
            .property("selected", type === "Consumption")
            .text("Consumption");
        combo.append("option")
            .attr("value", "Production")
            .property("selected", type === "Production")
            .text("Production");
    }

}