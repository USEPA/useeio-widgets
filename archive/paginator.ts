import * as d3 from "d3";

import { Widget, Config } from "../widget";
import { Model } from "../webapi";

type Row = d3.Selection<HTMLTableRowElement, unknown, HTMLElement, any>;

export class Paginator extends Widget {

    private _totalCount: number;

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        d3.select(this.selector)
            .select("*")
            .remove();

        // calculate the number of pages
        const total = await this.totalCount();
        if (total === 0) {
            return;
        }
        let count = config.count || 20;
        if (count > total) {
            count = total;
        }

        const row = d3.select(this.selector)
            .append("table")
            .classed("useeio-paginator", true)
            .append("tbody")
            .append("tr");

        this.renderCountBox(count, row);

        const pageCount = Math.ceil(total / count);
        if (pageCount <= 1) {
            return;
        }

        // calculate the page interval
        let page = config.page || 1;
        if (page <= 0) {
            page = 1;
        }
        if (page > pageCount) {
            page = pageCount;
        }
        const start = page > 4 ? page - 3 : 1;
        let end = start + 6;
        if (end > pageCount) {
            end = pageCount;
        }

        const goTo = (nextPage: number) => {
            this.fireChange({ page: nextPage });
        };

        if (page > 1) {
            row.append("td")
                .classed("paginator-previous", true)
                .append("a")
                .text("Previous")
                .on("click", () => goTo(page - 1));
        }
        for (let i = start; i <= end; i++) {
            if (i === page) {
                row.append("td")
                    .classed("paginator-number", true)
                    .classed("paginator-selected", true)
                    .append("span")
                    .text(i);
                continue;
            }
            row.append("td")
                .classed("paginator-number", true)
                .append("a")
                .text(i)
                .on("click", () => goTo(i));
        }
        if (page < pageCount) {
            row.append("td")
                .classed("paginator-next", true)
                .append("a")
                .text("Next")
                .on("click", () => goTo(page + 1));
        }
    }

    private renderCountBox(count: number, row: Row) {
        row.append("td")
            .classed("paginator-counter-label", true)
            .text("Display:");

        const self = this;
        row.append("td")
            .classed("paginator-counter", true)
            .append("select")
            .on("change", function () {
                self.fireChange({ count: parseInt(this.value, 10) });
            })
            .selectAll("option")
            .data([-1, 10, 20, 30, 40, 50, 100])
            .enter()
            .append("option")
            .attr("value", d => d)
            .property("selected", d => d === count)
            .text(d => d === -1 ? "" : d);
    }

    private async totalCount(): Promise<number> {
        if (this._totalCount) {
            return this._totalCount;
        }
        const isMultiRegional = await this.model.isMultiRegional();
        if (!isMultiRegional) {
            this._totalCount = (await this.model.sectors()).length;
            return this._totalCount;
        }
        // in case of multi-regional models we use the number of
        // unique sector codes as total count
        const ids: { [code: string]: boolean } = {};
        const sectors = await this.model.sectors();
        let count = 0;
        for (const sector of sectors) {
            if (ids[sector.code]) {
                continue;
            }
            count++;
            ids[sector.code] = true;
        }
        this._totalCount = count;
        return this._totalCount;
    }
}