import * as d3 from "d3";
import { Widget, Config } from "../widget";


export class FilterWidget extends Widget {

    private selector: string;

    constructor(selector: string) {
        super();
        this.selector = selector;
        this.ready();
    }

    async handleUpdate(config: Config) {
        d3.select(this.selector)
            .selectAll("*")
            .remove();
        const root = d3.select(this.selector)
            .append("div")
            .classed("useeio-filter-widget", true);

        addRow(root, "Perspective:", perspective(config));
        addRow(root, "Analysis type:", config.analysis);
        addRow(root, "Year:", config.year);
        addRow(root, "Location:", config.location);
        this.ready();
    }
}

function perspective(config: Config): string | undefined {
    if (!config.perspective)
        return undefined;
    switch (config.perspective) {
        case "direct":
            return "Supply chain";
        case "final":
            return "Point of consumption";
        default:
            return undefined;
    }
}

type Elem = d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
function addRow(root: Elem, header: string, value: any) {
    const div = root.append("div")
        .classed("filter-row", true);
    div.append("label")
        .text(header);
    div.append("span")
        .classed("filter-value", true)
        .text(value ? value : "nothing selected");
}