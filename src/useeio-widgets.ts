import { FilterWidget } from "./filter-widget";
import { HashConfigTransmitter } from "./hash-config-transmitter";
import { ImpactHeatmap, HeatmapConfig } from "./impact-heatmap";
import { ImpactChart, ImpactChartConfig } from "./impact-chart";
import { SectorList, SectorListConfig } from "./sector-list";
import { SettingsWidget } from "./settings-widget";

export function filterWidget(conf: { selector: string }): FilterWidget {
    return new FilterWidget(conf.selector);
}

export function hashConfig() {
    return new HashConfigTransmitter();
}

export function impactChart(config: ImpactChartConfig): ImpactChart {
    const chart = new ImpactChart();
    chart.init(config);
    return chart;
}

export function impactHeatmap(config: HeatmapConfig): ImpactHeatmap {
    const heatmap = new ImpactHeatmap();
    heatmap.init(config);
    return heatmap;
}

export function sectorList(config: SectorListConfig): SectorList {
    const s = new SectorList(config);
    s.init();
    return s;
}

export function settingsWidget(conf: { selector: string }): SettingsWidget {
    return new SettingsWidget(conf.selector);
}