import * as d3 from "d3";
import { Config, Widget } from "./commons";
import * as webapi from "./webapi";
import * as colors from "./colors";

interface ChartConfig {
    selector: string;
    endpoint: string;
    model: string;
    width?: number;
    height?: number;
    columns?: number;
    responsive?: boolean;
    apikey?: string;
}

export function on(config: ChartConfig): ImpactChart {
    const chart = new ImpactChart();
    chart.init(config);
    return chart;
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

    private api: webapi.WebApi;
    private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private width: number;
    private height: number;
    private columns: number;

    private defaultIndicators = [
        "ACID",
        "ETOX",
        "EUTR",
        "GHG",
        "HTOX",
        "LAND",
        "OZON",
        "SMOG",
        "WATR",
    ];

    private sectors: webapi.Sector[];
    private indicators: webapi.Indicator[];
    private U: webapi.Matrix;

    async init(config: ChartConfig) {
        this.api = new webapi.WebApi(
            config.endpoint,
            config.model,
            config.apikey);

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
        const sectors = await this.getSectors(config.sectors);
        const indicators = await this.getIndicators(config.indicators);
        if (!indicators || indicators.length === 0) {
            this.svg.selectAll("*").remove();
            this.svg.append("text")
                .text("empty indicator selection")
                .attr("x", 40)
                .attr("y", 40);
            return;
        }
        const result = await this.getResult(sectors, indicators);
        this.svg.selectAll("*").remove();

        const indicatorCount = indicators.length;
        const columnCount = this.columns;
        const rowCount = Math.ceil(indicatorCount / columnCount);

        // definition of the chart grid
        const cellWidth = this.width / columnCount;
        const cellHeight = this.height / rowCount;
        const cellHeaderHeight = 25;
        const cellChartHeight = cellHeight - cellHeaderHeight - 10;

        for (let i = 0; i < indicators.length; i++) {

            // calculate the cell position
            const row = Math.floor(i / columnCount);
            const column = i % columnCount;
            const cellOffsetX = column * cellWidth;
            const cellOffsetY = row * cellHeight;

            // indicator name
            this.svg.append("text")
                .attr("x", cellOffsetX + 5)
                .attr("y", cellOffsetY + cellHeaderHeight - 5)
                .text(indicators[i].name);

            // baseline of the chart
            this.svg.append("line")
                .attr("x1", cellOffsetX + 5)
                .attr("x2", cellOffsetX + 5)
                .attr("y1", cellOffsetY + cellHeaderHeight)
                .attr("y2", cellOffsetY + cellHeaderHeight + cellChartHeight)
                .style("stroke-width", 1)
                .style("stroke", "#90a4ae");

            const sectorCount = sectors ? sectors.length : 0;
            if (sectorCount === 0) {
                continue;
            }

            const barBoxHeight = cellChartHeight / sectorCount;
            let barHeight = barBoxHeight - 10;
            if (barHeight < 0) {
                barHeight = barBoxHeight;
            }
            if (barHeight > 25) {
                barHeight = 25;
            }
            // the vertical margin of the bar within the bar box
            const barMarginY = (barBoxHeight - barHeight) / 2;
            for (let j = 0; j < sectorCount; j++) {
                const y = cellOffsetY + cellHeaderHeight
                    + j * barBoxHeight + barMarginY;
                this.svg.append("rect")
                    .attr("x", cellOffsetX + 5)
                    .attr("y", y)
                    .attr("width", result.get(i, j) * (cellWidth - 25))
                    .attr("height", barHeight)
                    .style("fill", colors.toCSS(colors.getChartColor(j), 0.6))
                    .on("mouseover", function () {
                        d3.select(this).style(
                            "fill", colors.toCSS(colors.getChartColor(j)));
                    })
                    .on("mouseout", function () {
                        d3.select(this).style(
                            "fill", colors.toCSS(colors.getChartColor(j), 0.6));
                    })
                    .append("title")
                    .text(sectors[j].name);
            }
        }
        this.ready();
    }

    private async getSectors(codes: string[]): Promise<webapi.Sector[] | null> {
        if (!codes || codes.length === 0) {
            return null;
        }
        if (!this.sectors) {
            this.sectors = await this.api.get("/sectors");
        }
        if (!this.sectors) {
            return null;
        }
        const r: webapi.Sector[] = [];
        for (const code of codes) {
            for (const sector of this.sectors) {
                if (code === sector.code) {
                    r.push(sector);
                }
            }
        }
        return r;
    }

    private async getIndicators(codes: string[]): Promise<webapi.Indicator[] | null> {
        const _codes = !codes || codes.length === 0
            ? this.defaultIndicators
            : codes;
        if (!this.indicators) {
            this.indicators = await this.api.get("/indicators");
        }
        if (!this.indicators) {
            return null;
        }
        const r: webapi.Indicator[] = [];
        for (const code of _codes) {
            for (const indicator of this.indicators) {
                if (code === indicator.code) {
                    r.push(indicator);
                }
            }
        }
        return r;
    }

    private async getResult(
        sectors: webapi.Sector[],
        indicators: webapi.Indicator[]): Promise<webapi.Matrix | null> {

        if (!sectors
            || !indicators
            || sectors.length === 0
            || indicators.length === 0) {
            return null;
        }

        if (!this.U) {
            const data: number[][] = await this.api.get("/matrix/U");
            this.U = new webapi.Matrix(data);
        }
        if (!this.U) {
            return null;
        }

        const m = webapi.Matrix.zeros(indicators.length, sectors.length);
        for (let i = 0; i < indicators.length; i++) {
            const indicator = indicators[i];
            let max = 0.0;
            for (let j = 0; j < sectors.length; j++) {
                const val = this.U.get(indicator.index, sectors[j].index);
                m.set(i, j, val);
                max = Math.max(val, max);
            }

            // make the results relative
            for (let j = 0; j < sectors.length; j++) {
                const val = m.get(i, j);
                if (val === 0) {
                    continue;
                }
                if (max !== 0) {
                    m.set(i, j, val / max);
                } else {
                    if (val < 0) {
                        m.set(i, j, -1);
                    } else {
                        m.set(i, j, 1);
                    }
                }
            }
        }
        return m;
    }
}