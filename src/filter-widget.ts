import * as d3 from "d3";

export function on(selector: string): FilterWidget {
    return new FilterWidget(selector);
}

export class FilterWidget {

    private selector: string;

    constructor(selector: string) {
        this.selector = selector;
    }

    update() {
        d3.select(this.selector)
            .append("h1")
            .text("Works!");
    }
}
