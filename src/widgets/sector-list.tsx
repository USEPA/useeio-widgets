import * as React from "react";
import * as ReactDOM from "react-dom";

import { Sector, Model } from "../webapi";
import { Config, Widget } from "../";
import * as colors from "../util/colors";
import * as strings from "../util/strings";

export class SectorDelete extends Widget {

    private sectors: Sector[];
    private selection: Sector[] = [];

    constructor(private model: Model, private selector: string) {
        super();
    }

    async update(config: Config) {
        if (!this.sectors) {
            const agg = await this.model.singleRegionSectors();
            this.sectors = agg.sectors;
        }
        this.selection = !config || !config.sectors
            ? []
            : this.sectors.filter(s => {
                return config.sectors.indexOf(s.code) >= 0;
            });
        this.sectors.sort((s1, s2) => {
            const s1Selected = selectionIndex(s1, config) >= 0;
            const s2Selected = selectionIndex(s2, config) >= 0;
            if (s1Selected === s2Selected) {
                return strings.compare(s1.name, s2.name);
            }
            return s1Selected ? -1 : 1;
        });

        ReactDOM.render(
            <Component
                sectors={this.sectors}
                widget={this}
                config={config} />,
            document.querySelector(this.selector));
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
}

const Component = (props: {
    sectors: Sector[],
    widget: SectorDelete,
    config: Config
}) => {

    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);
    const sectors = !searchTerm
        ? props.sectors
        : props.sectors.filter(s => {
            return selectionIndex(s, props.config) >= 0
                || strings.search(s.name, searchTerm) >= 0;
        });

    const items = sectors.map(sector => (
        <SectorItem
            key={sector.code}
            sector={sector}
            config={props.config}
            widget={props.widget} />
    ));

    return (
        <div>
            <div style={{ margin: "5px 15px" }}>
                <input type="search"
                    placeholder="Search"
                    style={{ width: "100%" }}
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
    config: Config,
    widget: SectorDelete,
}) => {

    const sector = props.sector;
    const selectionIdx = selectionIndex(sector, props.config);
    const style: React.CSSProperties = {};
    if (selectionIdx >= 0) {
        const color = colors.css(selectionIdx);
        style.border = `${color} solid 1px`;
    }

    return (
        <div className="sector-item" style={style}>
            <input type="checkbox"
                value={sector.code}
                checked={selectionIdx >= 0}
                readOnly={true}
                onClick={() => props.widget.onSelect(sector)} />
            <label
                onClick={() => props.widget.onSelect(sector)}>
                {props.sector.name}
            </label>
        </div>
    );
};

function selectionIndex(sector: Sector, config: Config): number {
    if (!sector || !config || !config.sectors) {
        return -1;
    }
    return config.sectors.indexOf(sector.code);
}
