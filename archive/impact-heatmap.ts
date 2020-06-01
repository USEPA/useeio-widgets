import * as d3 from "d3";
import * as colors from "../util/colors";
import * as strings from "../util/strings";
import * as conf from "../config";

import { Widget, Config } from "../widget";
import {
    Indicator,
    IndicatorGroup,
    Model,
    Sector,
} from "../webapi";
import { HeatmapResult } from "../calc/heatmap-result";

const INDICATOR_GROUPS = [
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.CHEMICAL_RELEASES,
    IndicatorGroup.WASTE_GENERATED,
    IndicatorGroup.ECONOMIC_SOCIAL,
];

type Elem = d3.Selection<HTMLElement, unknown, HTMLElement, any>;

export class ImpactHeatmap extends Widget {

    private result: null | HeatmapResult = null;
    private config: Config;

    private searchTerm: null | string = null;
    private sortIndicator: null | Indicator = null;

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        // TODO: check if an update is required
        this.config = config;

        d3.select(this.selector)
            .selectAll("*")
            .remove();

        const root = d3.select(this.selector)
            .append("div");

        this.result = await calculateResult(this.model, config);
        const indicators = await this.selectIndicators();

        const table = root
            .append("table")
            .style("width", "100%");

        // table header (matrix title, search box, indicators)
        const tr = table.append("thead")
            .append("tr")
            .classed("indicator-row", true);
        this.renderMatrixTitle(tr, indicators);
        this.renderIndicatorHeader(tr, indicators);

        // table body
        table.append("tbody")
            .classed("impact-heatmap-body", true);
        this.renderRows(indicators);
    }

    private async renderMatrixTitle(tr: Elem, indicators: Indicator[]) {
        const self = this;
        const div = tr.append("th")
            .append("div");
        div.append("span")
            .classed("matrix-title", true)
            .text("Goods & Services");

        const total = this.result.sectors.length;
        const count = this.config.count;
        if (count >= 0 && count <= total) {
            div.append("span")
                .classed("matrix-sub-title", true)
                .text(`${count} of ${total} industry sectors`);
        }

        div.append("input")
            .attr("type", "search")
            .attr("placeholder", "search")
            .on("input", function () {
                self.searchTerm = this.value;
                self.renderRows(indicators);
            });
    }

    private renderIndicatorHeader(tr: Elem, indicators: Indicator[]) {
        if (!indicators || indicators.length === 0) {
            return;
        }

        const header = (i: Indicator) => {
            const th = tr.append("th")
                .classed("indicator", true)
                .append("div")
                .append("a")
                .attr("title", i.name)
                .text(`${i.name} (${i.code})`);
            if (indicators.length > 1) {
                th.on("click", () => {
                    this.sortIndicator = this.sortIndicator === i
                        ? null
                        : i;
                    this.renderRows(indicators);
                });
            }
        };

        if (indicators.length === 1) {
            // no group headers when there is just
            // a single indicator
            header(indicators[0]);
            return;
        }

        const groupHeader = (group: IndicatorGroup) => {
            tr.append("th")
                .classed("indicator", true)
                .append("div")
                .append("span")
                .append("b")
                .text(group);
        };

        let g: IndicatorGroup | null = null;
        for (const indicator of indicators) {
            if (indicator.group !== g) {
                g = indicator.group;
                groupHeader(g);
            }
            header(indicator);
        }
    }

    private renderRows(indicators: Indicator[]) {
        const count = this.config.count || -1;
        const sectors = this.result.getRanking(
            indicators, count,
            this.searchTerm, this.sortIndicator);

        const tbody = d3.select("tbody.impact-heatmap-body");
        tbody.selectAll("*").remove();

        for (const sector of sectors) {
            const tr = tbody.append("tr");

            // the sector name
            tr.append("td")
                .style("border-top", "lightgray solid 1px")
                .style("padding", "5px 0px")
                .style("white-space", "nowrap")
                .append("a")
                .attr("href", `05_impact_chart_config.html#sectors=${sector.code}`)
                .attr("title", `${sector.name} - ${sector.code}\n\n${sector.description}`)
                .text(`${sector.code} - ${strings.cut(sector.name, 60)}`);
            this.renderIndicatorResult(tr, sector, indicators);
        }
    }

    private renderIndicatorResult(
        tr: Elem, sector: Sector, indicators: Indicator[]) {
        if (!indicators || indicators.length === 0) {
            return;
        }

        // render a bar when a single indicator is selected
        if (indicators.length === 1) {
            const ind = indicators[0];
            const color = colors.forIndicatorGroup(ind.group);
            const r = this.result.getResult(ind, sector);
            const share = this.result.getShare(ind, sector);
            const div = tr.append("td").append("div");
            div.append("span")
                .text(`${r.toExponential(2)} ${ind.unit}`);
            div.append("td")
                .append("svg")
                .attr("height", 15)
                .attr("width", 210)
                .append("rect")
                .attr("x", 0)
                .attr("y", 2.5)
                .attr("width", 200 * (0.1 + 0.9 * share))
                .attr("height", 10)
                .attr("fill", color);
            return;
        }

        let g: IndicatorGroup | null = null;
        for (const ind of indicators) {
            if (ind.group !== g) {
                // add an empty cell for the group
                g = ind.group;
                tr.append("td")
                    .classed("noborder", true);
            }
            const r = this.result.getResult(ind, sector);
            const share = this.result.getShare(ind, sector);
            let alpha = 0.1 + 0.9 * share;
            if (this.sortIndicator && this.sortIndicator !== ind) {
                alpha *= 0.25;
            }
            const color = colors.forIndicatorGroup(ind.group, alpha);
            tr.append("td")
                .attr("title", `${r.toExponential(2)} ${ind.unit}`)
                .style("background-color", color);
        }
    }

    private async selectIndicators(): Promise<Indicator[]> {
        if (this.config.show !== "mosaic") {
            return [];
        }
        const all = await this.model.indicators();
        if (!all || all.length === 0) {
            return [];
        }

        // filter indicators by configuration codes
        let codes = this.config.indicators;
        if (!codes || codes.length === 0) {
            codes = conf.DEFAULT_INDICATORS;
        }
        const indicators = all.filter(i => codes.indexOf(i.code) >= 0);
        if (indicators.length <= 1) {
            return indicators;
        }

        // sort indicators by groups and names
        indicators.sort((i1, i2) => {
            if (i1.group === i2.group) {
                return strings.compare(i1.code, i2.code);
            }
            const ix1 = INDICATOR_GROUPS.findIndex(g => g === i1.group);
            const ix2 = INDICATOR_GROUPS.findIndex(g => g === i2.group);
            return ix1 - ix2;
        });
        return indicators;
    }
}

async function calculateResult(model: Model, config: Config): Promise<HeatmapResult> {
    const demand = await model.findDemand(config);
    const result = await model.calculate({
        perspective: "final",
        demand: await model.demand(demand),
    });
    return HeatmapResult.from(model, result);
}