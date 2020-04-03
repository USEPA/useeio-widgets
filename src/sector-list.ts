import * as d3 from "d3";
import { Sector, WebApi } from "./webapi";
import { BaseType } from "d3";


interface ListConfig {
    selector: string;
    endpoint: string;
    model: string;
    apikey?: string;
}

export function on(config: ListConfig): SectorList {
    const s = new SectorList(config);
    s.init();
    return s;
}

export class SectorList {

    private webapi: WebApi;
    private config: ListConfig;
    private sectors: Sector[] = [];
    private selection: string[] = [];
    private root: d3.Selection<BaseType, any, HTMLElement, any>;

    constructor(config: ListConfig) {
        this.config = config;
        this.webapi = new WebApi(
            config.endpoint, config.model, config.apikey);
    }

    async init() {
        this.sectors = await this.webapi.get("/sectors");
        this.sectors.sort((s1, s2) => s1.name.localeCompare(s2.name));
        this.root = d3.select(this.config.selector)
            .append("div");
        this.render();
    }

    private render() {
        this.root.selectAll("*")
            .remove();

        const divs = this.root
            .selectAll("div")
            .data(this.sectors)
            .enter()
            .append("div")

        divs.append("input")
            .attr("type", "checkbox")
            .attr("value", (s) => s.code)
            .property("checked", (s) => this.isSelected(s))
            .on("click", (s) => this.selectionChanged(s));

        divs.append("label")
            .text((s) => s.name)
            .on("click", (s) => this.selectionChanged(s));
    }

    private isSelected(s: Sector): boolean {
        if (!s || !s.code) {
            return false;
        }
        return this.selection.indexOf(s.code) >= 0;
    }

    private selectionChanged(s: Sector) {
        if (!s || !s.code) {
            return;
        }
        const idx = this.selection.indexOf(s.code);
        if (idx < 0) {
            this.selection.push(s.code);
        } else {
            this.selection.splice(idx, 1);
        }
        this.render();
        // TODO: fire events...
    }

}