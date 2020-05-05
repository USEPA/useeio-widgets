import * as d3 from "d3";
import * as colors from "../colors";
import * as strings from "../strings";
import * as conf from "../config";

import { Widget } from "../widget";
import {
    Sector, Indicator, Matrix,
    IndicatorGroup, Model
} from "../webapi";

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
}

export class ImpactHeatmap extends Widget {

    private model: Model;
    private indicators: Indicator[] = [];
    private sectors: Sector[] = [];
    private result: null | Matrix = null;

    private sectorCount = 10;
    private searchTerm: null | string = null;
    private sortIndicator: null | Indicator = null;

    private root: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

    async init(config: HeatmapConfig) {
        this.model = config.model;
        this.sectorCount = config.sectorCount
            ? config.sectorCount
            : 10;
        this.root = d3.select(config.selector)
            .append("div");

        this.sectors = await this.model.sectors();
        this.indicators = await this.model.indicators();
        this.result = await this.model.matrix("U");

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
        firstHeader.append("th")
            .text("Goods & services")
            .style("width", "20%");

        // create the group headers
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
            .attr("colspan", g => g[1]);

        // the search box
        const self = this;
        const secondHeader = thead.append("tr");
        secondHeader
            .append("th")
            .append("input")
            .attr("type", "search")
            .attr("placeholder", "Search")
            .style("width", "100%")
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
            .style("border-left", "lightgray solid 1px")
            .attr("class", "indicator")
            .append("a")
            .attr("href", "#")
            .attr("title", (i) => i.name)
            .text(indicator => indicator.code)
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
        const sectors = selectSectors(
            this.sectors,
            indicators,
            this.result,
            this.sectorCount,
            this.searchTerm,
            this.sortIndicator);

        const ranges = getResultRanges(
            indicators, sectors, this.result);

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
                .attr("href", "#")
                .attr("title", `${sector.name} - ${sector.code}\n\n${sector.description}`)
                .text(strings.cut(sector.name, 40));

            // the result cells
            ranges.forEach(range => {
                const indicator = range[0];
                const r = this.result.get(indicator.index, sector.index);
                let alpha = 0.1 + 0.9 * getShare(r, range);
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
 * Calculates the selection and order of the sectors that are displayed in
 * the rows of the heatmap.
 */
function selectSectors(
    sectors: Sector[],
    indicators: Indicator[],
    result: Matrix,
    count: number,
    searchTerm: string | null,
    sortIndicator: Indicator | null): Sector[] {

    if (!sectors) {
        return [];
    }
    if (!indicators || indicators.length === 0 || !result) {
        return sectors
            .sort((s1, s2) => strings.compare(s1.name, s2.name))
            .slice(0, count);
    }

    type Score = [Sector, number];
    let scores: Score[];

    if (searchTerm) {
        scores = sectors
            .map(s => [s, strings.search(s.name, searchTerm)] as Score)
            .filter(score => score[1] >= 0)
            .sort((score1, score2) => score1[1] - score2[1]);

        if (sortIndicator) {
            scores = scores
                .map(score => {
                    const s = score[0];
                    return [s, result.get(sortIndicator.index, s.index)] as Score;
                })
                .sort((score1, score2) => score2[1] - score1[1]);
        }

    } else if (sortIndicator) {
        scores = sectors
            .map(s => [s, result.get(sortIndicator.index, s.index)] as Score)
            .sort((score1, score2) => score2[1] - score1[1]);

    } else {
        scores = sectors
            .map(s => {
                const total = indicators
                    .map(i => result.get(i.index, s.index))
                    .reduce((sum, x) => sum + Math.pow(x, 2), 0);
                return [s, Math.sqrt(total)] as Score;
            })
            .sort((score1, score2) => score2[1] - score1[1]);
    }

    return scores
        .map(score => score[0])
        .slice(0, count);
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

/**
 * An indicator result range: (indicator, minimum, maximum).
 */
type ResultRange = [Indicator, number, number];

/**
 * Calculates the result ranges of the given indicators and sectors. The ranges
 * are returned in the order of the given indicators.
 */
function getResultRanges(
    indicators: Indicator[],
    sectors: Sector[],
    result: Matrix): ResultRange[] {

    if (!indicators || indicators.length === 0
        || !sectors || sectors.length === 0
        || !result) {
        return [];
    }

    return indicators.map(indicator => {
        let max;
        let min;
        for (const sector of sectors) {
            const r = result.get(indicator.index, sector.index);
            if (max === undefined) {
                max = r;
                min = r;
            } else {
                max = Math.max(max, r);
                min = Math.min(min, r);
            }
        }
        return [indicator, min, max];
    });
}

function getShare(result: number, range: ResultRange): number {
    if (!result || result === 0) {
        return 0;
    }
    const [_, min, max] = range;
    if (min === max) {
        return 1;
    }
    return (result - min) / (max - min);
}