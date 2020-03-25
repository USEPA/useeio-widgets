import * as d3 from "d3";
import { WebApi } from "./webapi";

export function on(divID: string) {

    // responsive SVG: https://stackoverflow.com/a/25978286
    const root = d3.select(`#${divID}`)
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
        // Class to make it responsive.
        // .classed("svg-content-responsive", true)
        // Fill with a rectangle for visualization.
        .append("rect")
        .attr("width", 800)
        .attr("height", 800)
        .style("fill", "gold")
        .style("stroke", "steelblue")
        .style("stroke-width", "5px");

    // d3.select().append("svg");
}
