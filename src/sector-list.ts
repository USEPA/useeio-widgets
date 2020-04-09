import * as d3 from "d3";
import { Sector, WebApi, WebApiConfig } from "./webapi";
import { BaseType } from "d3";
import * as colors from "./colors";
import { Config, Widget } from "./commons";


interface ListConfig {
    webapi: WebApiConfig;
    selector: string;
}


export function on(config: ListConfig): SectorList {
    const s = new SectorList(config);
    s.init();
    return s;
}


export class SectorList extends Widget {

    private webapi: WebApi;
    private config: ListConfig;
    private root: d3.Selection<BaseType, any, HTMLElement, any>;

    private filterTerm: null | string = null;
    private sectors: Sector[] = [];
    private displayed: Sector[] = [];
    private selection: Sector[] = [];

    constructor(config: ListConfig) {
        super();
        this.config = config;
        this.webapi = new WebApi(config.webapi);
    }

    async init() {
        this.sectors = await this.webapi.get("/sectors");
        this.displayed = this.sectors;

        const top = d3.select(this.config.selector)
            .append("div");
        const self = this;
        top.append("div")
            .style("margin", "5px 15px")
            .append("input")
            .attr("type", "search")
            .attr("placeholder", "Search")
            .style("width", "100%")
            .style("height", "2em")
            .on("input", function () { self.filter(this.value); });

        this.root = top.append("div");
        this.render();
    }

    private filter(f: string) {
        if (!f || f.trim() === "") {
            this.displayed = this.sectors;
            this.filterTerm = null;
        } else {
            this.filterTerm = f.toLocaleLowerCase().trim();
            this.displayed = this.sectors.filter((s) => {
                if (this.selection.indexOf(s) >= 0) {
                    return true;
                }
                if (!s.name) {
                    return false;
                }
                return s.name
                    .toLocaleLowerCase()
                    .indexOf(this.filterTerm) >= 0;
            });
        }
        this.render();
    }

    private render() {
        if (!this.root) {
            return;
        }

        this.displayed.sort((s1, s2) => this.compare(s1, s2));
        this.root.selectAll("*")
            .remove();

        const divs = this.root
            .selectAll("div")
            .data(this.displayed)
            .enter()
            .append("div")
            .style("margin", "1px")
            .style("padding", "1px")
            .style("border", (s) => {
                const idx = this.selection.indexOf(s);
                if (idx < 0) {
                    return "none";
                } else {
                    const color = colors.toCSS(colors.getChartColor(idx));
                    return `${color} solid 1px`;
                }
            })
            .style("background-color", (s) => {
                const idx = this.selection.indexOf(s);
                if (idx < 0) {
                    return "white";
                } else {
                    return colors.toCSS(colors.getChartColor(idx), 0.1);
                }
            });

        divs.append("input")
            .attr("type", "checkbox")
            .attr("value", (s) => s.code)
            .property("checked", (s) => this.isSelected(s))
            .on("click", (s) => this.onSelect(s));

        divs.append("label")
            .text((s) => s.name)
            .on("click", (s) => this.onSelect(s));

        this.ready();
    }

    private isSelected(s: Sector): boolean {
        if (!s || !s.code) {
            return false;
        }
        return this.selection.indexOf(s) >= 0;
    }

    /**
     * Adds or removes the given sector to or from the selection.
     */
    private onSelect(sector: Sector) {
        if (!sector || !sector.code) {
            return;
        }
        const idx = this.selection.indexOf(sector);
        if (idx < 0) {
            this.selection.push(sector);
        } else {
            this.selection.splice(idx, 1);
        }
        this.selection.sort(
            (s1, s2) => s1.name && s2.name
                ? s1.name.localeCompare(s2.name)
                : 0);
        this.render();
        this.fireChange({
            sectors: this.selection.map((s) => s.code),
        });
    }

    private compare(s1: Sector, s2: Sector): number {
        const s1Selected = this.isSelected(s1);
        const s2Selected = this.isSelected(s2);

        // both sectors are selected => compare by name
        if (s1Selected && s2Selected) {
            return !s1.name || !s2.name
                ? 0
                : s1.name.localeCompare(s2.name);
        }

        // sector 1 or sector 2 is selected
        if (s1Selected || s2Selected) {
            return s1Selected ? -1 : 1;
        }

        // no sector is selected => check the filter term
        if (!s1.name || !s2.name) {
            return 0;
        }
        if (!this.filterTerm) {
            return s1.name.localeCompare(s2.name);
        }

        // the list is filtered so we know that each
        // sector name contains the filter term
        // we rank the sectors higher where the
        // filter term is more at the beginning of
        // the sector name
        const idx1 = s1.name.toLocaleLowerCase()
            .indexOf(this.filterTerm);
        const idx2 = s2.name.toLocaleLowerCase()
            .indexOf(this.filterTerm);
        return idx1 - idx2;
    }

    protected async handleUpdate(config: Config) {
        if (!config || !config.sectors) {
            this.selection = [];
            this.render();
            return;
        }
        this.selection = this.sectors.filter(s => {
            return config.sectors.indexOf(s.code) >= 0;
        });
        this.render();
    }

}