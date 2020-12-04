/** @format */

import * as React from "react";

import { Indicator, IndicatorGroup, Model } from "../../webapi";
import { RowProps } from "./sector-list";
import { Config } from "../../widget";
import * as colors from "../../util/colors";
import * as strings from "../../util/strings";
import * as conf from "../../config";

const INDICATOR_GROUPS = [
  IndicatorGroup.IMPACT_POTENTIAL,
  IndicatorGroup.RESOURCE_USE,
  IndicatorGroup.CHEMICAL_RELEASES,
  IndicatorGroup.WASTE_GENERATED,
  IndicatorGroup.ECONOMIC_SOCIAL,
];

/**
 * Select the indicators for the given configuration from the given model. If
 * no indicator result should be displayed according to the configuration, an
 * empty list is returned.
 */
export async function selectIndicators(
  config: Config,
  model: Model,
): Promise<Indicator[]> {
  if (!strings.isMember("mosaic", config.view)) {
    return [];
  }
  const all = await model.indicators();
  if (!all || all.length === 0) {
    return [];
  }

  // filter indicators by configuration codes
  let codes = config.indicators;
  if (!codes || codes.length === 0) {
    codes = conf.DEFAULT_INDICATORS;
  }
  const indicators = all.filter((i) => codes.indexOf(i.code) >= 0);
  if (indicators.length <= 1) {
    return indicators;
  }

  // sort indicators by groups and names
  indicators.sort((i1, i2) => {
    if (i1.group === i2.group) {
      return strings.compare(i1.code, i2.code);
    }
    const ix1 = INDICATOR_GROUPS.findIndex((g) => g === i1.group);
    const ix2 = INDICATOR_GROUPS.findIndex((g) => g === i2.group);
    return ix1 - ix2;
  });
  return indicators;
}

/**
 * Returns the header row cells for possible impact indicator results that
 * should be displayed in the industry list.
 */
export const ImpactHeader = (props: {
  indicators: Indicator[];
  onClick: (i: Indicator) => void;
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
          <a>
            {indicator.simplename || indicator.name} ({indicator.code})
          </a>
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
        </th>,
      );
    }

    // indicator header
    const key = `<indicator-${indicator.code}`;
    items.push(
      <th key={key} className="indicator">
        <div>
          <a onClick={() => props.onClick(indicator)}>
            {indicator.simplename || indicator.name}
          </a>
        </div>
      </th>,
    );
  }
  return <>{items}</>;
};
// Removed ({indicator.code})

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
            {`${config.showscientific ? r.toExponential(2) : r.toFixed(3)} ${
              ind.simpleunit
            }`}
          </span>
          <svg height="15" width="210" style={{ float: "left", clear: "both" }}>
            <rect
              x="0"
              y="2.5"
              height="10"
              fill={color}
              width={200 * (0.1 + 0.9 * share)}
            />
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
    const value = `${
      config.showscientific ? r.toExponential(2) : r.toFixed(3)
    } ${ind.simpleunit}`;
    items.push(
      <td
        className="indicator-value"
        key={ind.id}
        title={value}
        style={{ backgroundColor: color }}
      >
        {config.showvalues ? value : ""}
      </td>,
    );
  }
  return <>{items}</>;
};
