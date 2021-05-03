import React, { useState } from "react";
import * as ReactDOM from "react-dom";
import { createStyles, makeStyles, Theme, withStyles, Tooltip } from "@material-ui/core";

import { Widget } from "../widget";
import { Indicator, Sector, Model, DemandInfo } from "../webapi";
import * as colors from "../util/colors";
import * as constants from "../constants";
import { SectorAnalysis, zeros } from "../calc";
import { LoadingComponent } from "../util/components";
import { Config } from "../config";

export interface ImpactChartConfig {
    model: Model;
    selector: string;
    width?: number;
    height?: number;
    columns?: number;
    responsive?: boolean;
}


export class ImpactChart extends Widget {

    private model: Model;
    private svg: any;
    private width: number;
    private height: number;
    private columns: number;
    selector: string;
    async init(config: ImpactChartConfig) {
        this.model = config.model;
        this.width = config.width || 500;
        this.height = config.height || 500;
        this.columns = config.columns || 2;
        this.selector = config.selector;
        ReactDOM.render(<LoadingComponent key={" "} />, document.querySelector(this.selector));
    }

    async update(config: Config) {
        ReactDOM.render(<LoadingComponent key={" "} />, document.querySelector(this.selector));
        // get the data
        const indicators = await selectIndicators(this.model, config);
        if (!indicators || indicators.length === 0) {
            ReactDOM.render(<ResponsiveSVG
                responsive={config.responsive}
                width={this.width}
                height={this.height}
                childrens={[<text key={" "} x={40} y={40}>empty indicator selection</text>]}
            />, document.querySelector(this.selector));
            return;
        }
        const results = await getSectorResults(this.model, config);
        makeRelative(results, indicators);

        const indicatorCount = indicators.length;
        const columnCount = this.columns;
        const rowCount = Math.ceil(indicatorCount / columnCount);

        // definition of the chart grid
        const cellWidth = this.width / columnCount;
        const cellHeight = this.height / rowCount;
        const cellHeaderHeight = 25;
        const cellChartHeight = cellHeight - cellHeaderHeight - 10;

        const chartList = indicators.map((indicator, i) => {

            // calculate the cell position
            const row = Math.floor(i / columnCount);
            const column = i % columnCount;
            const cellOffsetX = column * cellWidth;
            const cellOffsetY = row * cellHeight;

            // indicator name
            const text = <text
                className={"useeio-impact-chart-indicator"}
                x={cellOffsetX + 5}
                y={cellOffsetY + cellHeaderHeight - 5}>
                {indicators[i].name}
            </text>;

            // baseline of the chart
            const line = <line
                x1={cellOffsetX + 5}
                x2={cellOffsetX + 5}
                y1={cellOffsetY + cellHeaderHeight}
                y2={cellOffsetY + cellHeaderHeight + cellChartHeight}
                style={{ strokeWidth: 1, stroke: "#90a4ae" }}
            />;

            const sectorCount = results.length;
            if (sectorCount === 0) {
                return;
            }

            const barBoxHeight = cellChartHeight / sectorCount;
            let barHeight = barBoxHeight - 5;
            if (barHeight < 5) {
                barHeight = barBoxHeight;
            }
            if (barHeight > 25) {
                barHeight = 25;
            }
            // the vertical margin of the bar within the bar box
            const barMarginY = (barBoxHeight - barHeight) / 2;
            const rectList = results.map((result, j) => {
                const y = cellOffsetY + cellHeaderHeight
                    + j * barBoxHeight + barMarginY;
                return (
                    <Bar
                        key={result.sector.name}

                        x={cellOffsetX + 5}
                        y={y}
                        width={result.profile[indicator.index] * (cellWidth - 25)}
                        height={barHeight}
                        color={colors.css(j)}
                        sectorName={result.sector.name}
                    />
                );
            });
            return <Chart key={indicators[i].name} text={text} line={line} rectList={rectList} />;
        });
        ReactDOM.render(<ResponsiveSVG
            responsive={config.responsive}
            width={this.width}
            height={this.height}
            childrens={chartList}
        />, document.querySelector(this.selector));
    }

}

/**
 * Creates a responsive SVG element.
 * See: https://stackoverflow.com/a/25978286
 */
type SVGProps = { responsive: boolean, width: number, height: number, childrens: JSX.Element[] };
const ResponsiveSVG = ({ responsive, width, height, childrens }: SVGProps) => {
    const useStyles = makeStyles(() =>
        createStyles({
            parentSVGResponsive: {
                display: "inline-block",
                position: "relative",
                width: "100%",
                paddingBottom: "100%",
                verticalAlign: "top",
                overflow: "hidden"
            },
            svgResponsive: {
                display: "inline-block",
                position: "absolute",
                top: 0,
                left: 0
            },
            parentSVG: {
                margin: "auto",
                width: `${width}px`
            },
            mySvg: {
                width: width,
                height: height
            }
        }),
    );
    const classes = useStyles();
    return (
        <div className={responsive ? classes.parentSVGResponsive : classes.parentSVG}>
            <svg
                preserveAspectRatio="xMinYMin meet"
                viewBox={`0 0 ${width} ${height}`}
                className={responsive ? classes.svgResponsive : classes.mySvg}>
                {childrens.map(children => children)}
            </svg>
        </div>
    );
};


const Chart = ({ text, line, rectList }: { text: JSX.Element, line: JSX.Element, rectList: any[] }) => {
    return (
        <>
            { text}
            { line}
            { rectList.map(rect => rect)};
        </>
    );
};

type BarProps = { x: number, y: number, width: number, height: number, color: string, sectorName: string };
const Bar = ({ x, y, width, height, color, sectorName }: BarProps) => {
    const [opacity, setOpacity] = useState("0.6");
    const LightTooltip = withStyles((theme: Theme) => ({
        tooltip: {
            backgroundColor: theme.palette.common.white,
            color: 'rgba(0, 0, 0, 0.87)',
            boxShadow: theme.shadows[1],
            fontSize: 11,
        },
    }))(Tooltip);

    return (
        <>
            <LightTooltip title={sectorName}>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{ fill: color, opacity: opacity }}
                    onMouseEnter={() => setOpacity("1.0")}
                    onMouseLeave={() => setOpacity("0.6")}
                />
            </LightTooltip>
        </>
    );
};

async function selectIndicators(model: Model, c: Config): Promise<Indicator[]> {
    if (!model) return [];
    const _codes = !c || !c.indicators || c.indicators.length === 0
        ? constants.DEFAULT_INDICATORS
        : c.indicators;
    const indicators = await model.indicators();
    const selected = [];
    for (const code of _codes) {
        const indicator = indicators.find(i => i.code === code);
        if (indicator) {
            selected.push(indicator);
        }
    }
    return selected;
}

type SectorResult = {
    sector: Partial<Sector>,
    profile: number[],
};

async function getSectorResults(model: Model, c: Config): Promise<SectorResult[]> {
    if (!c || !c.sectors)
        return [];

    // calculate the environmental profiles; for a single
    // sector code multiple results are aggregated to a
    // single result when no location filter is set in a
    // multi regional model.
    const totals = await getNormalizationTotals(model, c);
    const allSectors = await model.sectors();
    const results: SectorResult[] = [];
    for (const code of c.sectors) {
        const sectors = allSectors.filter(s => {
            if (s.code !== code)
                return false;
            if (c.location && s.location !== c.location)
                return false;
            return true;
        });
        if (sectors.length === 0)
            continue;
        const profile = zeros(totals.length);
        for (const s of sectors) {
            const analysis = new SectorAnalysis(s, model, totals);
            const p = await analysis.getEnvironmentalProfile(
                c.perspective === "direct");
            p.forEach((x, i) => profile[i] += x);
        }
        const sector = sectors.length === 1
            ? sectors[0]
            : {
                code,
                name: sectors[0].name
            };
        results.push({ sector, profile });
    }
    return results;
}

async function getNormalizationTotals(model: Model, c: Config): Promise<number[]> {
    const demandSpec: Partial<DemandInfo> = {
        type: c.analysis ? c.analysis : "Consumption",
    };
    if (c.location) {
        demandSpec.location = c.location;
    }
    if (c.year) {
        demandSpec.year = c.year;
    }
    const demand = await model.findDemand(demandSpec);
    return model.getTotalResults(demand);
}

function makeRelative(results: SectorResult[], indicators: Indicator[]) {
    if (results.length === 0)
        return;

    if (results.length === 1) {
        const r = results[0];
        const maxval = indicators.reduce((max, indicator) => {
            return Math.max(max, Math.abs(r.profile[indicator.index]));
        }, 0);
        r.profile = r.profile.map(x => maxval === 0 ? 0 : x / maxval);
        return;
    }

    indicators.forEach((indicator) => {
        const i = indicator.index;
        const maxval = results.reduce(
            (max, r) => Math.max(max, Math.abs(r.profile[i])), 0);
        for (const r of results) {
            r.profile[indicator.index] = maxval === 0
                ? 0
                : r.profile[i] / maxval;
        }
    });
}
