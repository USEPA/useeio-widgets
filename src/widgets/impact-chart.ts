import * as d3 from "d3";
import { Config, Widget } from "../widget";
import { Indicator, Sector, Model, DemandInfo } from "../webapi";
import * as colors from "../util/colors";
import * as conf from "../config";
import { SectorAnalysis } from "../calc/sector-analysis";
import { zeros } from "../calc/calc";

export interface ImpactChartConfig {
    model: Model;
    selector: string;
    width?: number;
    height?: number;
    columns?: number;
    responsive?: boolean;
}

/**
 * Creates a responsive SVG element.
 * See: https://stackoverflow.com/a/25978286
 */
function responsiveSVG(selector: string, width: number, height: number) {
    return d3.select(selector)
        .append("div")
        .style("display", "inline-block")
        .style("position", "relative")
        .style("width", "100%")
        .style("padding-bottom", "100%")
        .style("vertical-aling", "top")
        .style("overflow", "hidden")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("display", "inline-block")
        .style("position", "absolute")
        .style("top", 0)
        .style("left", 0);
}

export class ImpactChart extends Widget {

    private model: Model;
    private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private width: number;
    private height: number;
    private columns: number;

    async init(config: ImpactChartConfig) {
        this.model = config.model;

        this.width = config.width || 500;
        this.height = config.height || 500;
        this.columns = config.columns || 2;

        // create the root SVG element
        this.svg = config.responsive
            ? responsiveSVG(
                config.selector,
                this.width,
                this.height)
            : d3.select(config.selector)
                .append("div")
                .style("margin", "auto")  // center the SVG
                .style("width", `${this.width}px`)
                .append("svg")
                .attr("width", this.width)
                .attr("height", this.height);
        this.ready();
    }

    async handleUpdate(config: Config) {
        this.svg.selectAll("*").remove();
        this.svg.append("text")
            .text("Loading ...")
            .attr("x", 40)
            .attr("y", 40);

        // get the data
        const indicators = await selectIndicators(this.model, config);
        if (!indicators || indicators.length === 0) {
            this.svg.selectAll("*").remove();
            this.svg.append("text")
                .text("empty indicator selection")
                .attr("x", 40)
                .attr("y", 40);
            return;
        }
        const results = await getSectorResults(this.model, config);
        makeRelative(results, indicators);
        this.svg.selectAll("*").remove();

        const indicatorCount = indicators.length;
        const columnCount = this.columns;
        const rowCount = Math.ceil(indicatorCount / columnCount);

        // definition of the chart grid
        const cellWidth = this.width / columnCount;
        const cellHeight = this.height / rowCount;
        const cellHeaderHeight = 25;
        const cellChartHeight = cellHeight - cellHeaderHeight - 10;

        indicators.forEach((indicator, i) => {

            // calculate the cell position
            const row = Math.floor(i / columnCount);
            const column = i % columnCount;
            const cellOffsetX = column * cellWidth;
            const cellOffsetY = row * cellHeight;

            // indicator name
            this.svg.append("text")
                .attr("x", cellOffsetX + 5)
                .attr("y", cellOffsetY + cellHeaderHeight - 5)
                .classed("useeio-impact-chart-indicator", true)
                .text(indicators[i].name);

            // baseline of the chart
            this.svg.append("line")
                .attr("x1", cellOffsetX + 5)
                .attr("x2", cellOffsetX + 5)
                .attr("y1", cellOffsetY + cellHeaderHeight)
                .attr("y2", cellOffsetY + cellHeaderHeight + cellChartHeight)
                .style("stroke-width", 1)
                .style("stroke", "#90a4ae");

            const sectorCount = results.length;
            if (sectorCount === 0) {
                return;
            }

            const barBoxHeight = cellChartHeight / sectorCount;
            let barHeight = barBoxHeight - 5;
            if (barHeight < 5) {
                barHeight = barBoxHeight;
            }
            if (barHeight > 25) {
                barHeight = 25;
            }
            // the vertical margin of the bar within the bar box
            const barMarginY = (barBoxHeight - barHeight) / 2;
            results.forEach((result, j) => {
                const y = cellOffsetY + cellHeaderHeight
                    + j * barBoxHeight + barMarginY;
                this.svg.append("rect")
                    .attr("x", cellOffsetX + 5)
                    .attr("y", y)
                    .attr("width", result.profile[indicator.index] * (cellWidth - 25))
                    .attr("height", barHeight)
                    .style("fill", colors.css(j))
                    .style("opacity", "0.6")
                    .on("mouseover", function () {
                        d3.select(this).style("opacity", "1.0");
                    })
                    .on("mouseout", function () {
                        d3.select(this).style("opacity", "0.6");
                    })
                    .append("title")
                    .text(result.sector.name);
            });

        });
        this.ready();
    }

}

async function selectIndicators(model: Model, c: Config): Promise<Indicator[]> {
    if (!model) return [];
    const _codes = !c || !c.indicators || c.indicators.length === 0
        ? conf.DEFAULT_INDICATORS
        : c.indicators;
    const indicators = await model.indicators();
    const selected = [];
    for (const code of _codes) {
        const indicator = indicators.find(i => i.code === code);
        if (indicator) {
            selected.push(indicator);
        }
    }
    return selected;
}

type SectorResult = {
    sector: Partial<Sector>,
    profile: number[],
};

async function getSectorResults(model: Model, c: Config): Promise<SectorResult[]> {
    if (!c || !c.sectors)
        return [];

    // calculate the environmental profiles; for a single
    // sector code multiple results are aggregated to a
    // single result when no location filter is set in a
    // multi regional model.
    const totals = await getNormalizationTotals(model, c);
    const allSectors = await model.sectors();
    const results: SectorResult[] = [];
    for (const code of c.sectors) {
        const sectors = allSectors.filter(s => {
            if (s.code !== code)
                return false;
            if (c.location && s.location !== c.location)
                return false;
            return true;
        });
        if (sectors.length === 0)
            continue;
        const profile = zeros(totals.length);
        for (const s of sectors) {
            const analysis = new SectorAnalysis(s, model, totals);
            const p = await analysis.getEnvironmentalProfile(
                c.perspective === "direct");
            p.forEach((x, i) => profile[i] += x);
        }
        const sector = sectors.length === 1
            ? sectors[0]
            : {
                code,
                name: sectors[0].name
            };
        results.push({ sector, profile });
    }
    return results;
}

async function getNormalizationTotals(model: Model, c: Config): Promise<number[]> {
    const demandSpec: Partial<DemandInfo> = {
        type: c.analysis ? c.analysis : "Consumption",
    };
    if (c.location) {
        demandSpec.location = c.location;
    }
    if (c.year) {
        demandSpec.year = c.year;
    }
    const demand = await model.findDemand(demandSpec);
    return model.getTotalResults(demand);
}

function makeRelative(results: SectorResult[], indicators: Indicator[]) {
    if (results.length === 0)
        return;

    if (results.length === 1) {
        const r = results[0];
        const maxval = indicators.reduce((max, indicator) => {
            return Math.max(max, Math.abs(r.profile[indicator.index]));
        }, 0);
        r.profile = r.profile.map(x => maxval === 0 ? 0 : x / maxval);
        return;
    }

    indicators.forEach((indicator) => {
        const i = indicator.index;
        const maxval = results.reduce(
            (max, r) => Math.max(max, Math.abs(r.profile[i])), 0);
        for (const r of results) {
            r.profile[indicator.index] = maxval === 0
                ? 0
                : r.profile[i] / maxval;
        }
    });
}