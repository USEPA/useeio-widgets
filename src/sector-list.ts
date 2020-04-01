import * as d3 from "d3";
import { Sector, WebApi } from "./webapi";


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

    constructor(config: ListConfig) {
        this.config = config;
        this.webapi = new WebApi(
            config.endpoint, config.model, config.apikey);
    }

    async init() {
        const sectors: Sector[] = await this.webapi.get("/sectors");
        const root = d3.select(this.config.selector)
            .append("div");
        for (const s of sectors) {
            root.append("input")
                .attr("type", "checkbox")
                .attr("value", s.code);
            root.append("label")
                .text(s.name);
            root.append("br");
        }
    }


}