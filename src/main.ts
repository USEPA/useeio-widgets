/**
 * This is the entry point of the widget API. Exported functions of this module
 * are available in the global `useeio` variable when the widget library is
 * imported. It re-exports some other modules so that these are then also
 * available under the `useeio` variable.
 *
 * @packageDocumentation
 */

import { FilterWidget } from "./widgets/filter";
import { UrlConfigTransmitter, WidgetArgs } from "./widget";
import { IndustryList } from "./widgets/industry-list/industry-list";
import { ImpactChart, ImpactChartConfig } from "./widgets/impact-chart";
import { SectorList } from "./widgets/sector-list";
import { SettingsWidget, SettingsWidgetConfig } from "./widgets/settings";
import { WebApiConfig, Model } from "./webapi";
import { ProfileChart, ProfileChartConfig } from "./charts/profile-chart";
import { Paginator } from "./widgets/paginator";
import { CountCombo } from "./widgets/count-combo";
import { MatrixSelector } from "./widgets/matrix-selector";
import { IOList } from "./widgets/industry-list/io-list";

export * from "./naics";
export * from "./webapi";

/**
 * Creates a new model for the given web-API configuration. A `Model` instance
 * caches the results of API requests and provides additional functions like
 * aggregating multi-regional sectors. Different widgets that access the same
 * web-API should use the same `Model` instance for efficiency reasons. Creating
 * a model instance in JavaScript looks like this:
 *
 * ```js
 * var model = useeio.model({
 *     endpoint: './api',
 *     model: modelID,
 *     asJsonFiles: true,
 * });
 * ```
 */
export function model(conf: WebApiConfig): Model {
    return new Model(conf);
}

export function filterWidget(conf: { selector: string }): FilterWidget {
    return new FilterWidget(conf.selector);
}

export function urlConfig() {
    return new UrlConfigTransmitter();
}

export function impactChart(config: ImpactChartConfig): ImpactChart {
    const chart = new ImpactChart();
    chart.init(config);
    return chart;
}

export function industryList(args: WidgetArgs): IndustryList {
    const widget = new IndustryList(args.model, args.selector);
    widget.scope = args.scope;
    return widget;
}

export function inputList(args: WidgetArgs): IOList {
    const widget = new IOList(args.model, "inputs", args.selector);
    widget.scope = args.scope;
    return widget;
}

export function outputList(args: WidgetArgs): IOList {
    const widget = new IOList(args.model, "outputs", args.selector);
    widget.scope = args.scope;
    return widget;
}

export function sectorList(args: WidgetArgs): SectorList {
    const widget = new SectorList(args.model, args.selector);
    widget.scope = args.scope;
    return widget;
}

export function settingsWidget(config: SettingsWidgetConfig): SettingsWidget {
    const widget = new SettingsWidget(config);
    widget.init();
    return widget;
}

export function profileChart(config: ProfileChartConfig): ProfileChart {
    const widget = new ProfileChart(config);
    return widget;
}

export function paginator(args: WidgetArgs): Paginator {
    const widget = new Paginator(args.model, args.selector);
    widget.scope = args.scope;
    return widget;
}

export function countCombo(args: WidgetArgs): CountCombo {
    const widget = new CountCombo(args.model, args.selector);
    widget.scope = args.scope;
    return widget;
}

export function matrixSelector(args: Partial<WidgetArgs>): MatrixSelector {
    const widget = new MatrixSelector(args.selector);
    widget.scope = args.scope;
    return widget;
}
