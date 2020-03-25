import * as d3 from "d3";
import * as webapi from "./webapi";

interface Config {
    div: string;
    endpoint: string;
    model: string;
    apikey?: string;
}

export function on(config: Config): ImpactChart {
    const root = svg(`#${config.div}`);
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
function svg(divID: string) {
    return d3.select(divID)
        .append("div")
        .style("display", "inline-block")
        .style("position", "relative")
        .style("width", "100%")
        .style("padding-bottom", "100%")
        .style("vertical-aling", "top")
        .style("overflow", "hidden")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 800 800")
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

        const sectors = await this.getSectors(sectorCodes);
        if (!sectors) {
            return;
        }
        const indicators = await this.getIndicators(indicatorCodes);
        if (!indicators) {
            return;
        }
        const result = await this.getResult(sectors, indicators);

        const width = 800;
        const height = 800;

        for (let i = 0; i < indicators.length; i++) {
            const rowOff = (height / indicators.length) * i;
            this.svg.append("text")
                .attr("x", 10)
                .attr("y", rowOff + 25)
                .style("font", "italic 16px serif")
                .text(indicators[i].name);
                
            // <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
            for (let j = 0; j < sectors.length; j++) {
                const colOff = (width / sectors.length) * j;
                this.svg.append("circle")
                    .attr("cx", colOff + 25)
                    .attr("cy", rowOff + 25)
                    .attr("r", 40 * result.get(i, j))
                    .attr("stroke", "black")
                    .attr("fill", "black")
            }
        }

        console.log(result);
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