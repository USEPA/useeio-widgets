import * as d3 from "d3";
import { WebApi } from "./webapi";

interface Config {
    div: string;
    endpoint: string;
    model: string;
    apikey?: string;
}

export async function on(config: Config) {

    svg(`#${config.div}`)
        .append("rect")
        .attr("width", 800)
        .attr("height", 800)
        .style("fill", "gold")
        .style("stroke", "steelblue")
        .style("stroke-width", "5px");

    const webapi = new WebApi(
        config.endpoint, 
        config.model, 
        config.apikey);
    console.log(await webapi.get('/sectors'))
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

type SVG =  d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;

class ImpactChart {

    private webapi: WebApi;
    private svg: SVG;

    constructor(webapi: WebApi, svg: SVG) {
        this.webapi = webapi;
        this.svg = svg;
    }

}