import * as React from "react";
import * as ReactDOM from "react-dom";

import * as colors from "../util/colors";
import * as strings from "../util/strings";
import * as conf from "../config";

import { Widget, Config } from "../widget";
import {
    Indicator,
    IndicatorGroup,
    Model,
    Sector,
} from "../webapi";
import { HeatmapResult } from "../calc/heatmap-result";
import { MatrixCombo } from "./matrix-selector";

const INDICATOR_GROUPS = [
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.CHEMICAL_RELEASES,
    IndicatorGroup.WASTE_GENERATED,
    IndicatorGroup.ECONOMIC_SOCIAL,
];

export class ImpactHeatmap extends Widget {

    /**
     * The current configuration of the heatmap.
     */
    config: Config;

    result: HeatmapResult;
    demand: { [code: string]: number };
    indicators: Indicator[];

    /**
     * The industry sectors of the model. This array is only initialized and
     * thus should be only used when this heatmap has no results.
     */
    sectors: Sector[];

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        this.config = config;

        // run a new calculation if necessary
        const needsCalc = this.needsCalculation(config);
        if (needsCalc) {
            this.result = await calculateResult(this.model, config);
        }
        if (!this.result) {
            // initialize the sector array
            const { sectors } = await this.model.singleRegionSectors();
            this.sectors = sectors;
        }

        // load the demand vector if required
        if (config.showvalues && (!this.demand || needsCalc)) {
            const demandID = await this.model.findDemand(config);
            const demand = await this.model.demand(demandID);
            if (demand) {
                const values: { [id: string]: number } = {};
                demand.forEach(e => values[e.sector] = e.amount);
                // this aggregates the demand values by sector
                // code for multi-regional models
                this.demand = {};
                for (const sector of (await this.model.sectors())) {
                    const val = values[sector.id];
                    if (!val) {
                        continue;
                    }
                    const sum = this.demand[sector.code];
                    this.demand[sector.code] = sum
                        ? sum + val
                        : val;
                }
            }
        }

        this.indicators = await this.syncIndicators(config);

        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this.selector));
    }

    private needsCalculation(newConfig: Config) {
        if (!newConfig || newConfig.show !== "mosaic")
            return false;

        if (!this.config || !this.result) {
            return true;
        }
        // changes in these fields trigger a calculation
        const fields = [
            "show",
            "perspective",
            "analysis",
            "year",
            "location",
            "show"
        ];
        for (const field of fields) {
            if (this.config[field] !== newConfig[field]) {
                return true;
            }
        }
        return false;
    }

    private async syncIndicators(config: Config): Promise<Indicator[]> {
        if (config.show !== "mosaic") {
            return [];
        }
        const all = await this.model.indicators();
        if (!all || all.length === 0) {
            return [];
        }

        // filter indicators by configuration codes
        let codes = config.indicators;
        if (!codes || codes.length === 0) {
            codes = conf.DEFAULT_INDICATORS;
        }
        const indicators = all.filter(i => codes.indexOf(i.code) >= 0);
        if (indicators.length <= 1) {
            return indicators;
        }

        // sort indicators by groups and names
        indicators.sort((i1, i2) => {
            if (i1.group === i2.group) {
                return strings.compare(i1.code, i2.code);
            }
            const ix1 = INDICATOR_GROUPS.findIndex(g => g === i1.group);
            const ix2 = INDICATOR_GROUPS.findIndex(g => g === i2.group);
            return ix1 - ix2;
        });
        return indicators;
    }
}

async function calculateResult(model: Model, config: Config): Promise<HeatmapResult> {
    const demand = await model.findDemand(config);
    const result = await model.calculate({
        perspective: "final",
        demand: await model.demand(demand),
    });
    return HeatmapResult.from(model, result);
}

const Component = (props: { widget: ImpactHeatmap }) => {

    const config = props.widget.config;
    const [sortIndicator, setSortIndicator] = React.useState<Indicator | null>(null);
    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);

    const indicators = props.widget.indicators;
    const result = props.widget.result;
    let sectors;
    if (result) {
        sectors = result.getRanking(indicators, searchTerm, sortIndicator);
    } else {
        sectors = props.widget.sectors;
        if (searchTerm && searchTerm.trim().length > 0) {
            sectors = sectors
                .map(s => [s, strings.search(s.name, searchTerm)] as [Sector, number])
                .filter(([, i]) => i >= 0)
                .sort(([, i], [, j]) => i - j)
                .map(([s,]) => s);
        } else {
            sectors.sort((s1, s2) => strings.compare(s1.name, s2.name));
        }
    }

    const count = config.count;
    if (count && count >= 0) {
        const page = config.page;
        if (page <= 1) {
            sectors = sectors.slice(0, count);
        } else {
            const offset = (page - 1) * count;
            if (offset < sectors.length) {
                sectors = sectors.slice(offset, offset + count);
            } else {
                sectors = sectors.slice(0, count);
            }
        }
    }

    const rows: JSX.Element[] = [];
    for (const sector of sectors) {
        rows.push(
            <Row key={sector.code}
                sector={sector}
                sortIndicator={sortIndicator}
                widget={props.widget} />
        );
    }

    return (
        <>
            {
                // display the matrix selector if we display a result
                props.widget.result
                    ? <MatrixCombo config={config} widget={props.widget} />
                    : <></>
            }
            <table style={{
                marginRight: "80px"
            }}>
                <thead>
                    <tr className="indicator-row">
                        <Header
                            widget={props.widget}
                            onSearch={term => setSearchTerm(term)} />
                        {config.showvalues
                            ? <th><div><span>Demand</span></div></th>
                            : <></>
                        }
                        <IndicatorHeader
                            indicators={indicators}
                            onClick={(i) => {
                                if (sortIndicator === i) {
                                    setSortIndicator(null);
                                } else {
                                    setSortIndicator(i);
                                }
                            }} />
                    </tr>
                </thead>
                <tbody className="impact-heatmap-body">
                    {rows}
                </tbody>
            </table>
        </>
    );
};

const Header = (props: {
    widget: ImpactHeatmap,
    onSearch: (term: string) => void,
}) => {

    const count = props.widget.config.count || -1;
    const total = props.widget.result?.sectors?.length || 0;
    const subTitle = count >= 0 && count < total
        ? `${count} of ${total} industry sectors`
        : `${total} industry sectors`;

    return (
        <th>
            <div>
                <span className="matrix-title">
                    Goods & Services
                </span>
                <span className="matrix-sub-title">
                    {subTitle}
                </span>
                <input type="search" placeholder="Search"
                    onChange={e => props.onSearch(e.target.value)}>
                </input>
            </div>
        </th>
    );
};

const IndicatorHeader = (props: {
    indicators: Indicator[],
    onClick: (i: Indicator) => void
}) => {

    // no indicators
    if (!props.indicators || props.indicators.length === 0) {
        return <></>;
    }

    // single indicator
    if (props.indicators.length === 1) {
        const indicator = props.indicators[0];
        return (
            <th className="indicator" key={indicator.code}>
                <div>
                    <a>{indicator.name} ({indicator.code})</a>
                </div>
            </th>
        );
    }

    // multiple indicators with groups
    const items: JSX.Element[] = [];
    let g: IndicatorGroup | null = null;
    for (const indicator of props.indicators) {
        // group header
        if (indicator.group !== g) {
            g = indicator.group;
            const gkey = g ? `group-${INDICATOR_GROUPS.indexOf(g)}` : "null";
            items.push(
                <th key={gkey} className="indicator">
                    <div className="indicator-group-parent">
                        <span className="indicator-group">
                            <b>{g}</b>
                        </span>
                    </div>
                </th>
            );
        }

        // indicator header
        const key = `<indicator-${indicator.code}`;
        items.push(
            <th key={key} className="indicator">
                <div>
                    <a onClick={() => props.onClick(indicator)}>
                        {indicator.name} ({indicator.code})
                    </a>
                </div>
            </th>
        );
    }
    return <>{items}</>;
};

type RowProps = {
    sector: Sector,
    sortIndicator: Indicator | null,
    widget: ImpactHeatmap,
};

const Row = (props: RowProps) => {

    const config = props.widget.config;
    const sector = props.sector;
    const selected = config.sectors?.indexOf(sector.code) >= 0
        ? true
        : false;
    const onSelect = () => {
        let codes = config.sectors;
        if (selected) {
            const idx = codes.indexOf(sector.code);
            codes.splice(idx, 1);
        } else {
            codes = !codes ? [] : codes.slice(0);
            codes.push(sector.code);
        }
        props.widget.fireChange({ sectors: codes });
    };

    const sectorLabel = `${sector.code} - ${sector.name}`;

    // display the demand value if showvalues=true
    let demand;
    if (config.showvalues) {
        const demandVal = props.widget.demand[sector.code];
        demand = <td style={{
            borderTop: "lightgray solid 1px",
            padding: "5px 0px",
            whiteSpace: "nowrap",
        }}>
            {demandVal ? demandVal.toExponential(2) : null}
        </td>;
    }

    return (
        <tr>
            <td key={props.sector.code}
                style={{
                    borderTop: "lightgray solid 1px",
                    padding: "5px 0px",
                    whiteSpace: "nowrap",
                }}>
                <div style={{ cursor: "pointer" }}>
                    <input type="checkbox"
                        checked={selected}
                        onChange={onSelect}>
                    </input>

                    <a title={sectorLabel}
                        onClick={onSelect}>
                        {strings.cut(sectorLabel, 80)}
                    </a>
                </div>
            </td>
            {config.showvalues ? demand : <></>}
            <IndicatorResult {...props} />
        </tr>
    );
};

/**
 * Appends possible indicator result columns to a row in the heatmap. If no
 * indicators are in the selection, nothing is appended. For a single indicator
 * a result bar is rendered and when there are multiple indicators in the
 * selection mosaic cells are appended.
 */
const IndicatorResult = (props: RowProps) => {

    const config = props.widget.config;
    const indicators = props.widget.indicators;
    const result = props.widget.result;
    if (!indicators || indicators.length === 0 || !result) {
        return <></>;
    }

    // render a bar when a single indicator is selected
    if (indicators.length === 1) {
        const ind = indicators[0];
        const color = colors.forIndicatorGroup(ind.group);
        const r = result.getResult(ind, props.sector);
        const share = result.getShare(ind, props.sector);
        return (
            <td key={ind.id}>
                <div>
                    <span style={{ float: "left" }}>
                        {`${r.toExponential(2)} ${ind.unit}`}
                    </span>
                    <svg height="15" width="210"
                        style={{ float: "left", clear: "both" }}>
                        <rect x="0" y="2.5"
                            height="10" fill={color}
                            width={200 * (0.1 + 0.9 * share)} />
                    </svg>
                </div>
            </td>
        );
    }

    // render mosaic cells
    const items: JSX.Element[] = [];
    let g: IndicatorGroup | null = null;
    for (const ind of indicators) {
        if (ind.group !== g) {
            // add an empty grey cell for the group
            const gkey = g ? `group-${INDICATOR_GROUPS.indexOf(g)}` : "null";
            g = ind.group;
            items.push(<td key={gkey} className="noborder" />);
        }
        const r = result.getResult(ind, props.sector);
        const share = result.getShare(ind, props.sector);
        let alpha = 0.1 + 0.9 * share;
        if (props.sortIndicator && props.sortIndicator !== ind) {
            alpha *= 0.25;
        }
        const color = colors.forIndicatorGroup(ind.group, alpha);
        const value = `${r.toExponential(2)} ${ind.unit}`;
        items.push(
            <td className="indicator-value" key={ind.id}
                title={value}
                style={{ backgroundColor: color }}>
                {config.showvalues ? value : ""}
            </td>
        );
    }
    return <>{items}</>;
};

const DownloadSection = (props: {
    onClick: (format: "CSV" | "JSON") => void,
}) => {
    return (
        <div className="download-section">
            <span>Download: </span>
            <a className="download-link"
                onClick={() => props.onClick("JSON")}>
                JSON
            </a>
            <span> | </span>
            <a className="download-link"
                onClick={() => props.onClick("CSV")}>
                CSV
            </a>
        </div>
    );
};
