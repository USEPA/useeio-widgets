import * as d3 from "d3";
import { Widget, Config } from "./commons";

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
        const div = d3.select(this.selector)
            .append("div");

        div.append("b")
            .text("Perspective: ");
        const perspective = div.append("span");
        switch (config.perspective) {
            case "direct":
                perspective.text("Supply chain");
                break;
            case "upstream":
                perspective.text("Point of consumption");
                break;
            default:
                perspective.text("nothing selected");
        }

        div.append("br");
        div.append("b")
            .text("Analysis type: ");
        const analysis = div.append("span");
        switch (config.analysis) {
            case "consumption":
                analysis.text("Consumption");
                break;
            case "production":
                analysis.text("Production");
                break;
            default:
                analysis.text("nothing selected");
        }

        this.ready();
    }
}
