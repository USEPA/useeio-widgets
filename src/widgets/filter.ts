import * as d3 from "d3";
import { Widget, Config } from "../widget";
import { scaleDiverging } from "d3";

type Elem = d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

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

        this.perspective(root, config);
        this.analysisType(root, config);
        this.ready();
    }

    private perspective(root: Elem, config: Config) {
        const div = root
            .append("div")
            .classed("filter-row", true);
        div.append("label")
            .text("Perspective:");
        const perspective = div.append("span")
            .classed("filter-value", true);
        switch (config.perspective) {
            case "direct":
                perspective.text("Supply chain");
                break;
            case "final":
                perspective.text("Point of consumption");
                break;
            default:
                perspective.text("nothing selected");
        }
    }

    private analysisType(root: Elem, config: Config) {
        const div = root.append("div")
            .classed("filter-row", true);
        div.append("label")
            .text("Analysis type:");
        div.append("span")
            .classed("filter-value", true)
            .text(config.analysis
                ? config.analysis
                : "nothing selected");
    }
}
