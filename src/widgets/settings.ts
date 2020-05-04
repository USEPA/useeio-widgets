import * as d3 from "d3";
import * as strings from "../strings";
import { Widget, Config } from "../widget";
import {
    DemandType,
    Model,
    ResultPerspective,
} from "../webapi";

export interface SettingsWidgetConfig {
    selector: string;
    model: Model;
}

type Elem = d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

export class SettingsWidget extends Widget {

    private demandTypes: DemandType[] = [];
    private years: number[] = [];
    private locations: string[] = [];

    constructor(private config: SettingsWidgetConfig) {
        super();
    }

    async init() {
        if (!this.config || !this.config.model) {
            this.ready();
            return;
        }

        // start request
        const model = this.config.model;
        const sectors = model.sectors();
        const demands = model.demands();

        // get possible locations from sectors
        (await sectors).forEach(sector => {
            if (!sector.location) {
                return;
            }
            const loc = sector.location;
            if (this.locations.indexOf(loc) < 0) {
                this.locations.push(loc);
            }
        });
        this.locations.sort(strings.compare);

        // get demand types and years from demand infos
        (await demands).forEach(d => {
            if (d.type && this.demandTypes.indexOf(d.type) < 0) {
                this.demandTypes.push(d.type);
            }
            if (d.year && this.years.indexOf(d.year) < 0) {
                this.years.push(d.year);
            }
        });

        this.demandTypes.sort(strings.compare);
        this.years.sort();

        // render with defaults
        this.render({
            analysis: "Consumption",
            perspective: "direct",
        });

        this.ready();
    }

    protected async handleUpdate(config: Config) {
        this.render(config);
    }

    private render(config: Config) {
        const root = d3.select(this.config.selector);
        root.selectAll("*")
            .remove();
        this.perspectiveRow(config, root);
        this.analysisTypeRow(config, root);
        this.yearRow(config, root);
        this.locationRow(config, root);
    }

    private perspectiveRow(config: Config, root: Elem) {
        const perspective: ResultPerspective = config.perspective
            ? config.perspective
            : "direct";
        const row = addRow(root, "Perspective");

        // combo box with event handler
        const self = this;
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

    private analysisTypeRow(config: Config, root: Elem) {
        const self = this;
        const type: DemandType = config.analysis
            ? config.analysis
            : "Consumption";
        const row = addRow(root, "Analysis type");

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

    private yearRow(config: Config, root: Elem) {
        if (!this.years || this.years.length === 0) {
            return;
        }
        const row = addRow(root, "Year");

        const self = this;
        const combo = row.append("select")
            .attr("value", this.years[0])
            .on("change", function () {
                self.fireChange({
                    year: parseInt(this.value, 10),
                });
            });

        combo.selectAll("option")
            .data(this.years)
            .enter()
            .append("option")
            .attr("value", year => year)
            .property("selected", year => config.year
                ? year === config.year
                : year === this.years[0])
            .text(year => year);
    }

    private locationRow(config: Config, root: Elem) {
        if (!this.locations || this.locations.length === 0) {
            return;
        }
        const row = addRow(root, "Location");

        const self = this;
        const combo = row.append("select")
            .attr("value", this.locations[0])
            .on("change", function () {
                self.fireChange({
                    location: this.value,
                });
            });

        combo.selectAll("option")
            .data(this.locations)
            .enter()
            .append("option")
            .attr("value", loc => loc)
            .property("selected", loc => config.location
                ? loc === config.location
                : loc === this.locations[0])
            .text(loc => loc);
    }
}

function addRow(root: Elem, label: string): Elem {
    const row = root
        .append("div")
        .classed("settings-row", true);
    row.append("label")
        .classed("settings-label", true)
        .text(label);
    return row;
}