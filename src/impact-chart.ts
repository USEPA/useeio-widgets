import * as d3 from "d3";

export function on(divID: string) {
    d3.select(`#${divID}`).append("svg");
}
