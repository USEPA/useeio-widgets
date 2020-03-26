import * as d3 from "d3";
import * as webapi from "./webapi";

interface Config {
    selector: string;
    endpoint: string;
    model: string;
    width?: number;
    height?: number;
    responsive?: boolean;
    apikey?: string;
}

export function on(config: Config): ImpactChart {
    const root = config.responsive
        ? responsiveSVG(config)
        : d3.select(config.selector)
            .append("div")
            .style("margin", "auto")  // center the SVG
            .style("width", `${config.width || 500}px`)
            .append("svg")
            .attr("width", config.width || 500)
            .attr("height", config.height || 500);
    const api = new webapi.WebApi(
        config.endpoint,
        config.model,
        config.apikey);
    return new ImpactChart(api, root);
}

/**
 * Creates a responsive SVG element.
 * See: https://stackoverflow.com/a/25978286
 */
function responsiveSVG(config: Config) {
    const width = config.width || 500;
    const height = config.height || 500;
    return d3.select(config.selector)
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
        .style("left", 0)
}

type SVG = d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;

export class ImpactChart {

    private api: webapi.WebApi;
    private svg: SVG;

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

    constructor(api: webapi.WebApi, svg: SVG) {
        this.api = api;
        this.svg = svg;
    }

    async init() {
        this.indicators = await this.api.get("/indicators");
        console.log(`loaded ${this.indicators.length} indicators`);
        console.log(this.sectors.slice(0, 10))
    }

    async update(sectorCodes: string[], indicatorCodes?: string[]) {
        this.svg.selectAll("*").remove();

        // get the data
        const sectors = await this.getSectors(sectorCodes);
        const indicators = await this.getIndicators(indicatorCodes);
        if (!indicators || indicators.length === 0) {
            return;
        }
        const result = await this.getResult(sectors, indicators);

        const width = 400;
        const height = 400;
        const indicatorCount = indicators.length;
        const sectorCount = sectors ? sectors.length : 0;
        const columnCount = 2;
        const rowCount = Math.ceil(indicatorCount / columnCount);

        // definition of the chart grid
        const cellWidth = width / columnCount;
        const cellHeight = height / rowCount;
        const cellHeaderHeight = 25;
        const cellChartHeight = cellHeight - cellHeaderHeight;

        for (let i = 0; i < indicators.length; i++) {

            // calculate the cell position
            const row = Math.floor(i / columnCount);
            const column = i % columnCount;
            const cellOffsetX = column * cellWidth;
            const cellOffsetY = row * cellHeight;

            // render the cell header
            this.svg.append("text")
                .attr("x", cellOffsetX + 5)
                .attr("y", cellOffsetY + 15)
                .text(indicators[i].name);


            /*
            const rowOff = (height / indicators.length) * i;
            this.svg.append("text")
                .attr("x", 10)
                .attr("y", rowOff + 25)
                .style("font", "italic 16px serif")
                .text(indicators[i].name);

            for (let j = 0; j < sectors.length; j++) {
                const colOff = (width / sectors.length) * j;
                this.svg.append("circle")
                    .attr("cx", colOff + 25)
                    .attr("cy", rowOff + 25)
                    .attr("r", 40 * result.get(i, j))
                    .attr("stroke", "black")
                    .attr("fill", "black")
            }
            */
        }

        /*
        this.svg.append("rect")
            .attr("width", 800)
            .attr("height", 800)
            .style("fill", "gold")
            .style("stroke", "steelblue")
            .style("stroke-width", "5px");
        */
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
            const data: number[][] = await this.api.get('/matrix/U');
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