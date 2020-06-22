import * as React from "react";
import * as ReactDOM from "react-dom";

import * as d3 from "d3";
import { Sector, Model } from "../webapi";
import { BaseType } from "d3";
import { Config, Widget } from "../widget";
import * as colors from "../util/colors";

export class SectorList extends Widget {

    private root: d3.Selection<BaseType, any, HTMLElement, any>;

    private filterTerm: null | string = null;
    private sectors: Sector[];
    private displayed: Sector[] = [];
    selection: Sector[] = [];

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {

        if (!this.sectors) {
            const agg = await this.model.singleRegionSectors();
            this.sectors = agg.sectors;
        }

        this.selection = !config || !config.sectors
            ? []
            : this.sectors.filter(s => {
                return config.sectors.indexOf(s.code) >= 0;
            });

        this.displayed = this.sectors;

        ReactDOM.render(
            <Component sectors={this.sectors} widget={this} />,
            document.querySelector(this.selector));
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
        this.renderSectorItems();
    }

    private renderSectorItems() {
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
            .classed("sector-item", true)
            .style("border", (s) => {
                const idx = this.selection.indexOf(s);
                if (idx >= 0) {
                    const color = colors.css(idx);
                    return `${color} solid 1px`;
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
    onSelect(sector: Sector) {
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

}

const Component = (props: {
    sectors: Sector[],
    widget: SectorList,
}) => {

    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);

    const items = props.sectors.map(sector => (
        <SectorItem
            key={sector.code}
            sector={sector}
            widget={props.widget} />
    ));

    return (
        <div>
            <div style={{ margin: "5px 15px" }}>
                <input type="search"
                    placeholder="Search"
                    style={{width: "100%"}}
                    onChange={e => setSearchTerm(e.target.value?.trim())} />
            </div>
            <div>
                {items}
            </div>
        </div>
    );
};

const SectorItem = (props: {
    sector: Sector,
    widget: SectorList,
}) => {

    const selectionIdx = props.widget.selection.indexOf(props.sector);
    const style: React.CSSProperties = {};
    if (selectionIdx >= 0) {
        const color = colors.css(selectionIdx);
        style.border = `${color} solid 1px`;
    }

    return (
        <div className="sector-item" style={style}>
            <input type="checkbox"
                value={props.sector.code}
                checked={selectionIdx >= 0}
                readOnly={true}
                onClick={() => props.widget.onSelect(props.sector)} />
            <label
                onClick={() => props.widget.onSelect(props.sector)}>
                {props.sector.name}
            </label>
        </div>
    );
};