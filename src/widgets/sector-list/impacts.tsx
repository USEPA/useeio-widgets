import * as React from "react";

import { Indicator, IndicatorGroup, Model } from "../../webapi";
import { indicatorSorter, RowProps } from "./sector-list";
import * as colors from "../../util/colors";
import * as strings from "../../util/strings";
import * as constants from "../../constants";
import { isNotNone } from "../../util/util";
import { Config } from "../../config";
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { makeStyles } from "@material-ui/core/styles";

const INDICATOR_GROUPS_POLICY = [
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.CHEMICAL_RELEASES,
    IndicatorGroup.WASTE_GENERATED,
    IndicatorGroup.ECONOMIC_SOCIAL,
];

const INDICATOR_GROUPS_PLANNING = [
    IndicatorGroup.ECONOMIC_SOCIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.CHEMICAL_RELEASES,
    IndicatorGroup.WASTE_GENERATED,
];

/**
 * Select the indicators for the given configuration from the given model. If
 * no indicator result should be displayed according to the configuration, an
 * empty list is returned.
 */
export async function selectIndicators(
    config: Config, model: Model): Promise<Indicator[]> {

    const all = await model.indicators();
    if (!all || all.length === 0) {
        return [];
    }

    // filter indicators by configuration codes
    let codes = config.view_indicators;
    if (!codes || codes.length === 0) {
        codes = constants.DEFAULT_INDICATORS;
    }
    const indicators = all.filter(i => codes.indexOf(i.code) >= 0);
    if (indicators.length <= 1) {
        return indicators;
    }
    const INDICATOR_GROUPS: IndicatorGroup[] = getIndicatorOrder(config);
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

/**
 * Returns the header row cells for possible impact indicator results that
 * should be displayed in the industry list.
 */
export const ImpactHeader = (props: {
    indicators: Indicator[],
    onClick: (i: Indicator) => void,
    config: Config,
    sorter: indicatorSorter
}) => {

    // no indicators
    if (!strings.isMember("mosaic", props.config.view) || !props.indicators || props.indicators.length === 0) {
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
            const gkey = g ? `group-${getIndicatorOrder(props.config).indexOf(g)}` : "null";
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
        const useStyles = makeStyles({
            arrow: {
                width: "0.6em",
                position: "relative",
                float: "left"
            },
            indicatorSorted: {
                position: "relative",
                bottom: 3,
                left: 5
            }
        });
        const classes = useStyles();
        // indicator header
        const key = `<indicator-${indicator.code}`;
        let arrow = <></>;
        const sorted = props.sorter && props.sorter.indicators.includes(indicator);
        if (sorted) {
            if (props.sorter.state === "desc")
                arrow = <ArrowDownwardIcon className={classes.arrow} />;
            else
                arrow = <ArrowUpwardIcon className={classes.arrow} />;
        }
        items.push(
            <th key={key} className="indicator">
                {arrow}
                <div>
                    <a onClick={() => props.onClick(indicator)} className={sorted ? classes.indicatorSorted : ""}>
                        {indicator.name} ({indicator.code})
                    </a>
                </div>
            </th>
        );
    }
    return <>{items}</>;
};

/**
 * Appends possible indicator result columns to a row in the heatmap. If no
 * indicators are in the selection, nothing is appended. For a single indicator
 * a result bar is rendered and when there are multiple indicators in the
 * selection mosaic cells are appended.
 */
export const ImpactResult = (props: RowProps) => {

    const config = props.widget.config;
    const indicators = props.widget.indicators;
    const result = props.widget.result;
    if (!strings.isMember("mosaic", config.view) || !indicators || indicators.length === 0 || !result) {
        return <></>;
    }

    // render a bar when a single indicator is selected
    if (indicators.length === 1) {
        const ind = indicators[0];
        const color = colors.forIndicatorGroup(ind.group);
        const r = result.getResult(ind, props.sector);
        const share = result.getShare(ind, props.sector);
        let formatedResult = config.showscientific ? r.toExponential(2) : r.toFixed(3);
        if (ind.unit === "$")
            formatedResult = ind.unit + formatedResult;
        else
            formatedResult + ind.unit;
        return (
            <td key={ind.id}>
                <div>
                    <span style={{ float: "left" }}>
                        {formatedResult}
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
            const gkey = g ? `group-${getIndicatorOrder(config).indexOf(g)}` : "null";
            g = ind.group;
            items.push(<td key={gkey} className="noborder" />);
        }
        const r = result.getResult(ind, props.sector);
        const share = result.getShare(ind, props.sector);
        const alpha = 0.1 + 1.2 * Math.sqrt(Math.abs(share));
        // Extra transparency on non sorted columns
        // if (props.sortIndicator && props.sortIndicator !== ind) {
        //     alpha *= 0.25;
        // }
        const color = colors.forIndicatorGroup(ind.group, alpha);
        let value = config.showscientific ? r.toExponential(2) : abbreviateNumberWithSI(r);
        if (ind.unit === "$")
            value = ind.unit + value;
        else
            value = value + " " + ind.unit;
        let isIndicatorSelected = "";
        // We box the sorted column
        if (isNotNone(props.sortIndicator) && props.sortIndicator.includes(ind)) {
            isIndicatorSelected = "sector-list-table_sorted-cell-side";
            if (props.index === 0) {
                isIndicatorSelected += " sector-list-table_sorted-cell-top";
            } else if (props.index === config.count - 1) {
                isIndicatorSelected += " sector-list-table_sorted-cell-bottom";
            }
        }
        items.push(
            <td
                className={`indicator-value ${isIndicatorSelected}`}
                key={ind.id}
                title={value}
                style={{ backgroundColor: color }}
            >
                {config.showvalues ? value : ""}
            </td>
        );
    }
    return <>{items}</>;
};

/**
 * Get the right indicators order, according to the config
 */
function getIndicatorOrder(config: Config) {
    switch (config.indicators_order) {
        case "planning":
            return INDICATOR_GROUPS_PLANNING;
        default: // "policy"
            return INDICATOR_GROUPS_POLICY;
    }
}

/**
 * Increases the number of decimal digits until the number has the right number of digits
 */
function formatDecimalNumber(r: number) {
    let value: string;
    let decimal = 3; // default digits number
    if (r === 0.0)
        return r.toFixed(0);

    let n;
    do {
        value = r.toFixed(decimal);
        n = parseFloat(value);
        decimal++;
    } while (n === 0.0);

    return value;
}


/**
 * Add a suffix to the number if it is too big, like "k" for 1e3, "M" for 1e6, etc
 * The suffix come from the SI :
 * https://en.wikipedia.org/wiki/International_System_of_Units#Prefixes
 * 
 * @param number The number to abbreviate
 * @returns The abbreviated number, followed by the appropriate suffix
 */
function abbreviateNumberWithSI(number: number) {
    const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

    const tier = Math.log10(Math.abs(number)) / 3 | 0;
    if (tier == 0) return number;
    const suffix = SI_SYMBOL[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;

    return formatDecimalNumber(scaled) + suffix;
}

