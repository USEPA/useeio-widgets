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

const INDICATOR_GROUPS = [
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.CHEMICAL_RELEASES,
    IndicatorGroup.WASTE_GENERATED,
    IndicatorGroup.ECONOMIC_SOCIAL,
];

export class ImpactHeatmap extends Widget {

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        const result = await calculateResult(this.model, config);
        const indicators = await this.selectIndicators(config);

        ReactDOM.render(
            <Component
                config={config}
                indicators={indicators}
                result={result} />,
            document.querySelector(this.selector));
    }

    private async selectIndicators(config: Config): Promise<Indicator[]> {
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

const Component = (props: {
    result: HeatmapResult,
    indicators: Indicator[],
    config: Config,
}) => {

    const [sortIndicator, setSortIndicator] = React.useState<Indicator | null>(null);
    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);

    const count = props.config.count || -1;
    const sectors = props.result.getRanking(
        props.indicators, count,
        searchTerm, sortIndicator);
    const rows: JSX.Element[] = [];
    for (const sector of sectors) {
        rows.push(
            <Row
                key={sector.code}
                sector={sector}
                indicators={props.indicators}
                result={props.result}
                sortIndicator={sortIndicator} />
        );
    }

    return (
        <table style={{ width: "100%" }}>
            <thead>
                <tr className="indicator-row">
                    <Header
                        displayCount={props.config.count}
                        sectorCount={props.result.sectors.length}
                        onSearch={term => setSearchTerm(term)} />
                    <IndicatorHeader
                        indicators={props.indicators}
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
    indicators: Indicator[],
    result: HeatmapResult,
    sortIndicator: Indicator | null,
};

const Row = (props: RowProps) => {
    const sectorLabel = `${props.sector.code} - ${props.sector.name}`;
    const code = props.sector.code;
    return (
        <tr>
            <td key={props.sector.code}
                style={{
                    borderTop: "lightgray solid 1px",
                    padding: "5px 0px",
                    whiteSpace: "nowrap",
                }}>
                <a title={sectorLabel}
                    href={`05_impact_chart_config.html#sectors=${code}`}>
                    {strings.cut(sectorLabel, 80)}
                </a>
            </td>
            <IndicatorResult {...props} />
        </tr>
    );
};

const IndicatorResult = (props: RowProps) => {

    if (!props.indicators || props.indicators.length === 0) {
        return <></>;
    }

    // render a bar when a single indicator is selected
    if (props.indicators.length === 1) {
        const ind = props.indicators[0];
        const color = colors.forIndicatorGroup(ind.group);
        const r = props.result.getResult(ind, props.sector);
        const share = props.result.getShare(ind, props.sector);
        return (
            <td key={ind.id}>
                <div>
                    <span style={{float: "left"}}>{`${r.toExponential(2)} ${ind.unit}`}</span>
                    <svg height="15" width="210" style={{float: "left", clear: "both"}}>
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
    for (const ind of props.indicators) {
        if (ind.group !== g) {
            // add an empty cell for the group
            const gkey = g ? `group-${INDICATOR_GROUPS.indexOf(g)}` : "null";
            g = ind.group;
            items.push(<td key={gkey} className="noborder" />);
        }
        const r = props.result.getResult(ind, props.sector);
        const share = props.result.getShare(ind, props.sector);
        let alpha = 0.1 + 0.9 * share;
        if (props.sortIndicator && props.sortIndicator !== ind) {
            alpha *= 0.25;
        }
        const color = colors.forIndicatorGroup(ind.group, alpha);
        items.push(
            <td key={ind.id}
                title={`${r.toExponential(2)} ${ind.unit}`}
                style={{ backgroundColor: color }} />
        );
    }
    return <>{items}</>;
};