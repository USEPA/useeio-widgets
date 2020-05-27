import * as d3 from "d3";
import * as colors from "../util/colors";
import * as strings from "../util/strings";
import * as conf from "../config";

import { Widget } from "../widget";
import {
    Indicator,
    IndicatorGroup,
    Model,
} from "../webapi";
import { HeatmapResult } from "../calc/heatmap-result";
import { ones } from "../calc/cals";

const INDICATOR_GROUPS = [
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.CHEMICAL_RELEASES,
    IndicatorGroup.WASTE_GENERATED,
    IndicatorGroup.ECONOMIC_SOCIAL,
];

export interface HeatmapConfig {
    model: Model;
    selector: string;
    sectorCount: number;
    skipNormalization?: boolean;
}

export class ImpactHeatmap extends Widget {

    private model: Model;
    private indicators: Indicator[] = [];
    private result: null | HeatmapResult = null;

    private sectorCount = 2000;
    private searchTerm: null | string = null;
    private sortIndicator: null | Indicator = null;

    private root: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

    async init(config: HeatmapConfig) {
        this.model = config.model;
        this.sectorCount = config.sectorCount
            ? config.sectorCount
            : 2000;

        this.indicators = await this.model.indicators();
        this.result = await calculateResult(config);
        this.root = d3.select(config.selector)
            .append("div");
        this.render();
        this.ready();
    }

    private render() {
        this.root.selectAll("*")
            .remove();

        const indicators = selectIndicators(
            this.indicators, conf.DEFAULT_INDICATORS);

        if (!indicators || indicators.length === 0 || !this.result) {
            this.root.append("p")
                .text("no data")
                .style("text-align", "center");
            return;
        }

        const table = this.root
            .append("table")
            .style("width", "100%");

        const thead = table.append("thead");
        const firstHeader = thead.append("tr");
        firstHeader.append("th");

        // create the group headers
        /*
        const groups = groupCounts(indicators);
        const total = groups.reduce((sum, g) => sum + g[1], 0);
        firstHeader.selectAll("th.indicator-group")
            .data(groups)
            .enter()
            .append("th")
            .attr("class", "indicator-group")
            .text(g => g[0])
            .style("width", g => `${80 * g[1] / total}%`)
            .style("border-left", "lightgray solid 1px")
            .style("border-bottom", "lightgray solid 1px")
            .attr("colspan", g => g[1]);
        */

        // the search box
        const self = this;
        const secondHeader = thead.append("tr").attr("class","indicator-row");
        secondHeader
            .append("th")
            .text("Goods & Services")
            .attr("class", "matrix-title")
            /* .style("width", "20%") */

            .append("input")
            .attr("type", "search")
            .attr("placeholder", "search")
            .on("input", function () {
                self.searchTerm = this.value;
                self.renderRows(indicators);
            });

        // the indicator row
        secondHeader
            .selectAll("th.indicator")
            .data(indicators)
            .enter()
            .append("th")
            /* .style("border-left", "lightgray solid 1px") */
            .attr("class", "indicator")
            .append("div")
            .append("a")
            .attr("href", "#")
            .attr("title", (i) => i.name)
            // .text(indicator => indicator.code) //
            .text(indicator => indicator.name)
            .on("click", (indicator) => {
                if (this.sortIndicator === indicator) {
                    this.sortIndicator = null;
                } else {
                    this.sortIndicator = indicator;
                }
                this.renderRows(indicators);
            });

        table.append("tbody")
            .classed("impact-heatmap-body", true);
        this.renderRows(indicators);
    }

    private renderRows(indicators: Indicator[]) {
        const sectors = this.result.getRanking(
            indicators, this.sectorCount,
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

            // the result cells
            indicators.forEach(indicator => {
                const r = this.result.getResult(indicator, sector);
                const share = this.result.getShare(indicator, sector);
                let alpha = 0.1 + 0.9 * share;
                if (this.sortIndicator && this.sortIndicator !== indicator) {
                    alpha *= 0.25;
                }
                tr.append("td")
                    .attr("title", `${r.toExponential(2)} ${indicator.unit}`)
                    .style("background-color", colors.forIndicatorGroup(
                        indicator.group, alpha));
            });
        }
    }
}

/**
 * Selects and sorts the given indicators for the columns in the heatmap.
 * The groups are considered in the order.
 */
function selectIndicators(indicators: Indicator[], codes: string[]): Indicator[] {
    if (!indicators || !codes) {
        return [];
    }
    return indicators
        .filter(i => codes.indexOf(i.code) >= 0)
        .sort((i1, i2) => {
            if (i1.group === i2.group) {
                return strings.compare(i1.code, i2.code);
            }
            const ix1 = INDICATOR_GROUPS.findIndex(g => g === i1.group);
            const ix2 = INDICATOR_GROUPS.findIndex(g => g === i2.group);
            return ix1 - ix2;
        });
}

/**
 * The numbers of indicators in a group.
 */
type GroupCount = [IndicatorGroup, number];

/**
 * Calculates the number of indicators that are in the respective groups. It
 * only returns a group if it has at least one indicator.
 */
function groupCounts(indicators: Indicator[]): GroupCount[] {
    if (!indicators || indicators.length === 0) {
        return [];
    }
    return INDICATOR_GROUPS
        .map(group => {
            const count = indicators.reduce((sum, indicator) => {
                return indicator.group === group
                    ? sum + 1
                    : sum;
            }, 0);
            return [group, count] as GroupCount;
        })
        .filter(g => g[1] > 0);
}

async function calculateResult(conf: HeatmapConfig): Promise<HeatmapResult> {
    const model = conf.model;
    if (conf.skipNormalization) {
        const U = await model.matrix("U");
        return HeatmapResult.from(conf.model, {
            sectors: (await model.sectors()).map(s => s.id),
            indicators: (await model.indicators()).map(i => i.code),
            totals: ones(U.rows),
            data: U.data,
        });
    }
    const demand = await this.model.findDemand({});
    const result = await this.model.calculate({
        perspective: "direct",
        demand: await this.model.demand(demand),
    });
    return HeatmapResult.from(this.model, result);
} 