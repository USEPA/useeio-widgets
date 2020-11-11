import * as React from "react";
import * as ReactDOM from "react-dom";

import { Grid} from "@material-ui/core";

import { Indicator, Matrix, Model, Sector } from "../../webapi";
import { Config, Widget } from "../../widget";
import { isNotNone, isNone } from "../../util/util";
import { zeros } from "../../calc/calc";
import * as strings from "../../util/strings";

import { CommodityList } from "./commodity-list";
import { FlowList } from "./flow-list";

/**
 * The row type of the input or output list.
 */
export type IOFlow = {
    id: string,
    name: string,
    value: number,
    share: number,
};

/**
 * A widget with 3 columns: inputs (upstream flows), commodities, and outputs
 * (downstream flows). The inputs and outputs are computed based on the
 * commodity selection and the direct coefficients matrix `A`. 
 */
export class IOGrid extends Widget {

    private sectors: Sector[];
    private sectorIndex: { [code: string]: number };
    private indicators: Indicator[];
    private techMatrix: Matrix;
    private directImpacts: Matrix;

    constructor(
        private model: Model,
        private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        if (!this.techMatrix) {
            await this.initialize();
        }

        // render the three columns:
        // inputs | commodities | outputs
        ReactDOM.render(
            <Grid container spacing={3}>
                <Grid item style={{ width: "30%" }}>
                    <FlowList
                        config={config}
                        widget={this}
                        direction="input" />
                </Grid>
                <Grid item style={{ width: "40%" }}>
                    <CommodityList
                        config={config}
                        sectors={this.sectors}
                        indicators={this.indicators}
                        widget={this} />
                </Grid>
                <Grid item style={{ width: "30%" }}>
                    <FlowList
                        config={config}
                        widget={this}
                        direction="output" />
                </Grid>
            </Grid>,
            document.querySelector(this.selector)
        );
    }

    private async initialize() {
        const rawSectors = await this.model.sectors();
        const rawA = await this.model.matrix("A");
        const rawD = await this.model.matrix("D");
        const isMultiRegional = await this.model.isMultiRegional();
        this.indicators = await this.model.indicators();

        if (!isMultiRegional) {
            this.sectors = rawSectors;
            this.techMatrix = rawA;
            this.directImpacts = rawD;
        } else {

            // in case of multi-regional model, we need aggregated the
            // m*m multi-regional matrix A to a n*n single region matrix
            // and the k*m multi-regional matrix D to a k*n single region
            // matrix
            // TODO: this needs to consider sector shares so that the
            // resulting columns are based on one unit of output! e.g.,
            // a demand vector could be used to calculate these shares
            const { index, sectors } = await this.model.singleRegionSectors();
            this.sectors = sectors;

            const m = rawSectors.length;
            const n = sectors.length;
            this.techMatrix = Matrix.zeros(n, n);
            for (let rawRow = 0; rawRow < m; rawRow++) {
                const rowCode = rawSectors[rawRow].code;
                const row = index[rowCode];
                if (isNone(row)) {
                    continue;
                }
                for (let rawCol = 0; rawCol < m; rawCol++) {
                    const val = rawA.get(rawRow, rawCol);
                    if (!val) {
                        continue;
                    }
                    const colCode = rawSectors[rawCol].code;
                    const col = index[colCode];
                    if (isNone(col)) {
                        continue;
                    }
                    const sum = this.techMatrix.get(row, col) + val;
                    this.techMatrix.set(row, col, sum);
                }
            }

            this.directImpacts = Matrix.zeros(rawD.rows, n);
            for (let i = 0; i < rawD.rows; i++) {
                for (let j = 0; j < rawD.cols; j++) {
                    const val = rawD.get(i, j);
                    if (!val) {
                        continue;
                    }
                    const colCode = rawSectors[j].code;
                    const col = index[colCode];
                    if (isNone(col)) {
                        continue;
                    }
                    const sum = this.directImpacts.get(i, col) + val;
                    this.techMatrix.set(i, col, sum);
                }
            }
        }

        // calculate the sector index that maps the sector codes
        // to the corresponding matrix indices
        this.sectorIndex = {};
        this.sectors.reduce((idx, sector) => {
            idx[sector.code] = sector.index;
            return idx;
        }, this.sectorIndex);
        this.sectors.sort((s1, s2) => strings.compare(s1.name, s2.name));
        this.indicators.sort((i1, i2) => strings.compare(i1.name, i2.name));
    }

    /**
     * Computes an input or output ranking based on the given sector
     * configuration. 
     */
    rank(config: Config, direction: "input" | "output"): IOFlow[] {

        // compute the sector index and scaling factor pairs
        const pairs: [number, number][] = [];
        if (config.sectors) {
            for (const s of config.sectors) {
                const parts = s.split(":");
                const code = parts[0];
                const factor = parts.length < 2
                    ? 1.0
                    : parseInt(parts[1]) / 100;
                const idx = this.sectorIndex[code];
                if (isNotNone(idx)) {
                    pairs.push([idx, factor]);
                }
            }
        }

        // initialize the ranking; not that the sectors
        // may are sorted by name, so we use the sector
        // indices for the matrix -> sector -> ranking
        // mappings below
        const n = this.sectors.length;
        const sectorValues: [Sector, number][] = new Array(n);
        for (const sector of this.sectors) {
            sectorValues[sector.index] = [sector, 0];
        }

        // put the scaled values into the rankings
        for (const pair of pairs) {
            const data = direction === "input"
                ? this.techMatrix.getCol(pair[0])
                : this.techMatrix.getRow(pair[0]);
            const factor = pair[1];
            data.forEach((value, i) => {
                sectorValues[i][1] += factor * value;
            });
        }

        const total = direction === "input"
            ? pairs.reduce((t, pair) => t + pair[1], 0)
            : sectorValues.reduce((t, sval) => t + sval[1], 0);
        const max = sectorValues.reduce(
            (m, sval) => Math.max(m, Math.abs(sval[1])), 0);
        const flows: IOFlow[] = sectorValues.map(([sector, value]) => {
            return {
                id: sector.id,
                name: sector.name,
                value: total ? value / total : 0,
                share: max ? value / max : 0,
            };
        });
        flows.sort((f1, f2) => f1.share !== f2.share
            ? f2.share - f1.share
            : strings.compare(f1.name, f2.name));
        return flows;
    }

    public getIndicatorResults(indicator: Indicator): number[] {
        return !indicator
            ? zeros(this.sectors.length)
            : this.directImpacts.getRow(indicator.index);
    }
}


