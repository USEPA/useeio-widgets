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
    DemandEntry,
} from "../webapi";
import { HeatmapResult } from "../calc/heatmap-result";

const INDICATOR_GROUPS = [
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.CHEMICAL_RELEASES,
    IndicatorGroup.WASTE_GENERATED,
    IndicatorGroup.ECONOMIC_SOCIAL,
];

export class ImpactHeatmap extends Widget {

    config: Config;
    result: HeatmapResult;
    demand: DemandEntry[];
    indicators: Indicator[];

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        const needsCalc = this.needsCalculation(config);
        this.config = config;
        if (needsCalc) {
            const demandID = await this.model.findDemand(config);
            this.demand = await this.model.demand(demandID);
            this.result = await calculateResult(this.model, config);
        }
        this.indicators = await this.syncIndicators(config);

        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this.selector));
    }

    private needsCalculation(newConfig: Config) {
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
    let sectors = result.getRanking(indicators, searchTerm, sortIndicator);

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
        <table style={{ width: "100%" }}>
            <thead>
                <tr className="indicator-row">
                    <Header
                        displayCount={config.count}
                        sectorCount={sectors.length}
                        onSearch={term => setSearchTerm(term)} />
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
    );
};

const Header = (props: {
    sectorCount: number,
    displayCount: number,
    onSearch: (term: string) => void,
}) => {

    const count = props.displayCount || -1;
    const total = props.sectorCount || 0;
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
                    <div>
                        <span>
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
    const selected = config.sectors && config.sectors.indexOf(sector.code) >= 0
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
            <IndicatorResult {...props} />
        </tr>
    );
};

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
                    <span style={{ float: "left" }}>{`${r.toExponential(2)} ${ind.unit}`}</span>
                    <svg height="15" width="210" style={{ float: "left", clear: "both" }}>
                        <rect x="0" y="2.5" height="10" fill={color}
                            width={200 * (0.1 + 0.9 * share)}></rect>
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
            // add an empty cell for the group
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
            <td key={ind.id}
                title={value}
                style={{ backgroundColor: color }}>
                {config.showvalues ? value : ""}
            </td>
        );
    }
    return <>{items}</>;
};