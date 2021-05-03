import * as apex from "apexcharts";
import { Config, Widget } from "../";
import { Model, Sector, Indicator } from "./../webapi";
import { max, SectorAnalysis, zeros } from "../calc";

export interface ProfileChartConfig {
    model: Model;
    selector: string;
}

export class ProfileChart extends Widget {

    constructor(private _chartConfig: ProfileChartConfig) {
        super();
    }

    async update(config: Config) {
        const options = await this.calculate(config);
        const chart = new ApexCharts(
            document.querySelector(this._chartConfig.selector),
            options,
        );
        chart.render();
    }

    private async calculate(config: Config): Promise<apex.ApexOptions> {
        const indicators = await this.selectIndicators(config);
        const sectors = await this.selectSectors(config);
        if (indicators.length === 0 || sectors.length === 0) {
            return {
                chart: { type: "bar" },
                series: [{
                    name: "profile",
                    data: [],
                }],
                xaxis: {
                    categories: [],
                },
            };
        }

        const demand = await this._chartConfig.model.findDemand({
            location: config.location ? config.location : undefined,
            type: config.analysis ? config.analysis : undefined,
            year: config.year ? config.year : undefined,
        });
        const totals = await this._chartConfig.model.getTotalResults(demand);

        const profile = zeros(indicators.length);
        for (const sector of sectors) {
            const analysis = new SectorAnalysis(
                sector,
                this._chartConfig.model,
                totals,
            );
            const p = await analysis.getEnvironmentalProfile(
                config.perspective === "direct");
            indicators.forEach((indicator, i) => {
                profile[i] += p[indicator.index];
            });
        }
        const maxval = max(profile);
        const data = profile.map(x => x / maxval);

        return {
            chart: { type: "bar", height: 350 },
            series: [{ name: "Profile", data }],
            yaxis: {
                axisTicks: { show: false },
                labels: { show: false },
                max: 1,
                min: 0,
            },
            tooltip: {
                enabled: true,
                custom: ({ dataPointIndex }) => {
                    const indicator = indicators[dataPointIndex];
                    return `
                        <div class="arrow_box">
                            <span>${indicator.name}</span>
                        </div>
                    `;
                },
            },
            dataLabels: { enabled: false },
            grid: { show: false },
            plotOptions: {
                bar: {
                    columnWidth: "50%",
                    colors: {
                        ranges: [{
                            from: 0,
                            to: indicators.length,
                            color: "#0071bc",
                        }],
                    }
                }
            },
            xaxis: {
                categories: indicators.map(i => i.code),
                axisTicks: { show: false },
            },
        };
    }

    private async selectIndicators(config: Config): Promise<Indicator[]> {
        if (!config.indicators || config.indicators.length === 0) {
            return [];
        }
        const indicators = await this._chartConfig.model.indicators();
        return indicators.filter(i => {
            return config.indicators.indexOf(i.code) >= 0;
        });
    }

    private async selectSectors(config: Config): Promise<Sector[]> {
        if (!config.sectors || config.sectors.length === 0) {
            return [];
        }
        const sectors = await this._chartConfig.model.sectors();
        return sectors.filter(s => {
            if (config.sectors.indexOf(s.code) < 0) {
                return false;
            }
            if (config.location && s.location !== config.location) {
                return false;
            }
            return true;
        });
    }
}
