import * as d3 from "d3";
import * as colors from "./colors";
import * as strings from "./strings";

import { Widget } from "./commons";
import {
    Sector, Indicator, Matrix, WebApi,
    IndicatorGroup, WebApiConfig
} from "./webapi";

interface HeatmapConfig {
    webapi: WebApiConfig;
    selector: string;
    sectorCount: number;
}

export function on(config: HeatmapConfig): ImpactHeatmap {
    const heatmap = new ImpactHeatmap();
    heatmap.init(config);
    return heatmap;
}

export class ImpactHeatmap extends Widget {

    private webapi: WebApi;
    private indicators: Indicator[] = [];
    private sectors: Sector[] = [];
    private result: null | Matrix = null;

    private sectorCount = 10;
    private searchTerm: null | string = null;

    private defaultIndicators = [
        "ACID",
        "ETOX",
        "EUTR",
        "GHG",
        "HRSP",
        "HTOX",
        "OZON",
        "SMOG",
        "ENRG",
        "LAND",
        "MNRL",
        "WATR",
        "CMSW",
        "CRHW",
        "METL",
        "PEST",
    ];

    private root: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

    async init(config: HeatmapConfig) {
        this.webapi = new WebApi(config.webapi);
        this.sectorCount = config.sectorCount
            ? config.sectorCount
            : 10;
        this.root = d3.select(config.selector)
            .append("div");

        this.sectors = await this.webapi.get("/sectors");
        this.indicators = await this.webapi.get("/indicators");
        this.result = new Matrix(await this.webapi.get("/matrix/U"));

        this.render();
        this.ready();
    }

    private render() {
        const self = this;
        this.root.selectAll("*")
            .remove();

        const indicators = this.indicators.filter(indicator => {
            return this.defaultIndicators.indexOf(indicator.code) >= 0;
        });
        const sectors = rank(
            this.sectors,
            indicators,
            this.result,
            this.sectorCount,
            this.searchTerm,
            null);

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
        let groups: [IndicatorGroup, number][] = [
            [IndicatorGroup.IMPACT_POTENTIAL, 0],
            [IndicatorGroup.RESOURCE_USE, 0],
            [IndicatorGroup.CHEMICAL_RELEASES, 0],
            [IndicatorGroup.WASTE_GENERATED, 0],
            [IndicatorGroup.ECONOMIC_SOCIAL, 0],
        ];
        let total = 0;
        for (const indicator of indicators) {
            const idx = groups.findIndex(g => indicator.group === g[0]);
            if (idx < 0) {
                continue;
            }
            groups[idx][1] += 1;
            total++;
        }
        if (total === 0) {
            return;
        }
        groups = groups.filter(g => g[1] > 0);
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
        const secondHeader = thead.append("tr");
        secondHeader
            .append("th")
            .append("input")
            .attr("type", "search")
            .attr("placeholder", "Search")
            .style("width", "100%")
            .on("input", function() {
                console.log(this.value);
                self.searchTerm = this.value;
                self.render();
            });

        // the indicator row
        indicators.sort((i1, i2) => {
            if (i1.group === i2.group) {
                return i1.code.localeCompare(i2.code);
            }
            const ix1 = groups.findIndex(g => g[0] === i1.group);
            const ix2 = groups.findIndex(g => g[0] === i2.group);
            return ix1 - ix2;
        });
        secondHeader
            .selectAll("th.indicator")
            .data(indicators)
            .enter()
            .append("th")
            .style("border-left", "lightgray solid 1px")
            .attr("class", "indicator")
            .append("a")
            .attr("href", "#")
            .text(indicator => indicator.code);

        // generate the rows
        const maxResults: number[] = [];
        const minResults: number[] = [];
        for (const indicator of indicators) {
            let max;
            let min;
            for (const sector of sectors) {
                const r = this.result.get(indicator.index, sector.index);
                if (max === undefined) {
                    max = r;
                    min = r;
                } else {
                    max = Math.max(max, r);
                    min = Math.min(min, r);
                }
            }
            maxResults.push(max);
            minResults.push(min);
        }

        const tbody = table.append("tbody");
        for (const sector of sectors) {
            const tr = tbody.append("tr");

            // the sector name
            tr.append("td")
                .style("border-top", "lightgray solid 1px")
                .style("padding", "5px 0px")
                .style("white-space", "nowrap")
                .append("a")
                .attr("href", "#")
                .text(sector.name);

            // the result cells
            indicators.forEach((indicator, i) => {
                const max = maxResults[i];
                const min = minResults[i];
                const r = this.result.get(indicator.index, sector.index);
                const alpha = max === min
                    ? 0
                    : 0.1 + 0.9 * (r - min) / (max - min);

                tr.append("td")
                    .attr("title", `${r.toExponential(2)} ${indicator.unit}`)
                    .style("background-color", colors.toCSS(
                        colors.getForIndicatorGroup(indicator.group),
                        alpha));
            });

        }
    }
}

/**
 * Calculates the selection and order of the sectors that are displayed in
 * the rows of the heatmap.
 */
function rank(
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