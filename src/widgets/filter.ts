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
        const div = d3.select(this.selector)
            .append("div");

        // result perspective
        div.append("b")
            .text("Perspective: ");
        const perspective = div.append("span");
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

        // analysis type
        div.append("br");
        div.append("b")
            .text("Analysis type: ");
        const analysis = div.append("span");
        if (config.analysis) {
            analysis.text(config.analysis);
        } else {
            analysis.text("nothing selected");
        }
        this.ready();
    }
}
