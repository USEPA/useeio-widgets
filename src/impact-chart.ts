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
    const chart =  new ImpactChart(api, root);
    await chart.init();
    return chart;
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

    private sectors: webapi.Sector[];
    private indicators: webapi.Indicator[];

    constructor(api: webapi.WebApi, svg: SVG) {
        this.api = api;
        this.svg = svg;
    }

    async init() {
        console.log("load sectors and indicators");
        this.sectors = await this.api.get("/sectors");
        console.log(`loaded ${this.sectors.length} sectors`);
        this.indicators = await this.api.get("/indicators");
        console.log(`loaded ${this.indicators.length} indicators`);
        console.log(this.sectors.slice(0, 10))
    }

    update(sectorCodes: string[], indicatorCodes?: string[], ) {
        this.svg.empty();
        if (!sectorCodes) {
            return;
        }
        this.svg.append("rect")
            .attr("width", 800)
            .attr("height", 800)
            .style("fill", "gold")
            .style("stroke", "steelblue")
            .style("stroke-width", "5px");
    }
}