import * as d3 from "d3";
import { Widget } from "./commons";
import { Sector, Indicator, Matrix, WebApi, IndicatorGroup } from "./webapi";
import * as colors from "./colors";

interface HeatmapConfig {
    selector: string;
    endpoint: string;
    model: string;
    apikey?: string;
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

    private selectedIndicators: Indicator[] = [];
    private selectedSectors: Sector[] = [];
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
        this.webapi = new WebApi(
            config.endpoint,
            config.model,
            config.apikey);
        this.sectorCount = config.sectorCount
            ? config.sectorCount
            : 10;
        this.root = d3.select(config.selector)
            .append("div");

        this.sectors = await this.webapi.get("/sectors");
        this.indicators = await this.webapi.get("/indicators");
        this.result = new Matrix(await this.webapi.get("/matrix/U"));

        this.selectedIndicators = this.indicators.filter(indicator => {
            return this.defaultIndicators.indexOf(indicator.code) >= 0;
        });
        this.selectedSectors = this.rankSectors();

        this.render();
        this.ready();
    }

    private rankSectors(): Sector[] {
        if (!this.sectors) {
            return [];
        }
        if (!this.result || !this.selectedIndicators) {
            const r = [...this.sectors];
            r.sort((s1, s2) => {
                if (!s1.name) {
                    return -1;
                }
                if (!s2.name) {
                    return 1;
                }
                return s1.name.localeCompare(s2.name);
            });
            return r.slice(0, this.sectorCount);
        }
        const ranked: [Sector, number][] = this.sectors.slice().map(sector => {
            let val = 0;
            for (const indicator of this.selectedIndicators) {
                val += Math.pow(this.result.get(
                    indicator.index, sector.index), 2);
            }
            return [sector, Math.sqrt(val)];
        });
        return ranked
            .sort((r1, r2) => r2[1] - r1[1])
            .map(r => r[0])
            .slice(0, this.sectorCount);
    }

    private render() {
        this.root.selectAll("*")
            .remove();

        if (!this.selectedIndicators || this.selectedIndicators.length === 0
            || !this.selectedSectors || this.selectedSectors.length === 0
            || !this.result) {
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
        for (const indicator of this.selectedIndicators) {
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
            .style("width", "100%");

        // the indicator row
        this.selectedIndicators.sort((i1, i2) => {
            if (i1.group === i2.group) {
                return i1.code.localeCompare(i2.code);
            }
            const ix1 = groups.findIndex(g => g[0] === i1.group);
            const ix2 = groups.findIndex(g => g[0] === i2.group);
            return ix1 - ix2;
        });
        secondHeader
            .selectAll("th.indicator")
            .data(this.selectedIndicators)
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
        for (const indicator of this.selectedIndicators) {
            let max;
            let min;
            for (const sector of this.selectedSectors) {
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
        for (const sector of this.selectedSectors) {
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
            this.selectedIndicators.forEach((indicator, i) => {
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