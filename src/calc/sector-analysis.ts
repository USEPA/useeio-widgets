import { IOModel } from "./IOModel";
import { Matrix } from "./matrix";
import { IIndicator, ISector } from "./model";
import * as webapi from "./webapi";

export function load(sector: ISector, ioModel: IOModel, totals: number[],
    cb: (sa: SectorAnalysis) => void) {
    const colA = `matrix/A?col=${sector.index}`;
    const colL = `matrix/L?col=${sector.index}`;
    webapi.getJson(colA, (purchases: number[]) => {
        webapi.getJson(colL, (scalings: number[]) => {
            cb(new SectorAnalysis(sector, purchases, scalings, ioModel, totals));
        });
    });
}

/**
 * Contains the indicator results of a sector analysis related to 1 USD output
 * broken into a part that is related to the direct operations of a sector and a
 * part that is related to the supply chain of that sector.
 */
export interface IPartition {
    totalResult: number[];
    directOperationsResult: number[];
    supplyChainResult: number[];
}

/**
 * This is the same as the IPartition result but the supply chain part is
 * further divided into an in-region and out-of-region part.
 */
export interface IRegionalizedPartition {
    totalResult: number[];
    directOperationsResult: number[];
    supplyChainResultInRegion: number[];
    supplyChainResultOutOfRegion: number[];
}

function zeros(len: number): number[] {
    const z = new Array(len);
    for (let i = 0; i < len; i++) {
        z[i] = 0.0;
    }
    return z;
}

export class SectorAnalysis {

    private normU: Matrix;
    private normD: Matrix;

    constructor(
        public sector: ISector,
        public purchases: number[],
        public scalingVector: number[],
        public ioModel: IOModel,
        public normalizationTotals: number[],
    ) {
        const nfactors = this.getNormalizationFactors();
        this.normU = ioModel.U.scaleColumns(purchases).scaleRows(nfactors);
        this.normD = ioModel.D.scaleColumns(scalingVector).scaleRows(nfactors);
    }

    public getEnvironmentalProfile(directOnly=false): number[] {
        const profile = directOnly
            ? this.ioModel.D.getCol(this.sector.index)
            : this.ioModel.U.getCol(this.sector.index);
        for (let i = 0; i < profile.length; i++) {
            profile[i] /= this.normalizationTotals[i];
        }
        return profile;
    }

    public getPartition(): IPartition {
        const direct = this.ioModel.D.getCol(this.sector.index);
        const totals = this.ioModel.U.getCol(this.sector.index);
        const partition: IPartition = {
            totalResult: totals,
            directOperationsResult: direct,
            supplyChainResult: new Array(direct.length),
        };
        for (let i = 0; i < direct.length; i++) {
            partition.supplyChainResult[i] = totals[i] - direct[i];
        }
        return partition;
    }

    public getRegionalizedPartition(): IRegionalizedPartition {
        const D = this.ioModel.D.scaleColumns(this.scalingVector);
        // if the model is not a multi-regional model -> there are no
        // out-of-region results
        if (!this.ioModel.isMultiRegional()) {
            const p = this.getPartition();
            return {
                totalResult: p.totalResult,
                directOperationsResult: p.directOperationsResult,
                supplyChainResultInRegion: p.supplyChainResult,
                supplyChainResultOutOfRegion: zeros(D.rows),
            };
        }

        const inRegionTotals = zeros(D.rows);
        const outRegionTotals = zeros(D.rows);
        const totals = zeros(D.rows);
        const location = this.sector.location;
        for (let row = 0; row < D.rows; row++) {
            for (let col = 0; col < D.cols; col++) {
                const value = D.get(row, col);
                if (!value) {
                    continue;
                }
                totals[row] += value;
                if (col === this.sector.index) {
                    continue;
                }
                const sector = this.ioModel.sectors[col];
                if (sector.location === location) {
                    inRegionTotals[row] += value;
                } else {
                    outRegionTotals[row] += value;
                }
            }
        }

        return {
            totalResult: totals,
            directOperationsResult: D.getCol(this.sector.index),
            supplyChainResultInRegion: inRegionTotals,
            supplyChainResultOutOfRegion: outRegionTotals,
        };
    }

    public getPurchaseContributions(indicator: IIndicator): number[] {
        const impacts = this.ioModel.U.getRow(indicator.index);
        const contributions = this.purchases.slice();
        for (let i = 0; i < contributions.length; i++) {
            contributions[i] *= impacts[i];
        }
        return contributions;
    }

    public getOverallPurchasesContributions(indicators: IIndicator[]): number[] {
        const r = zeros(this.scalingVector.length);
        for (const indicator of indicators) {
            for (let col = 0; col < r.length; col++) {
                r[col] += this.normU.get(indicator.index, col);
            }
        }
        return r;
    }

    /**
     * Get the direct contributions of the respective sectors to the result of
     * the given indicator. This is the respective row of the matrix D scaled
     * with the scaling vector of this analysis.
     */
    public getContributionsOfOrigins(indicator: IIndicator): number[] {
        const impacts = this.ioModel.D.getRow(indicator.index);
        const contributions = this.scalingVector.slice();
        for (let i = 0; i < contributions.length; i++) {
            contributions[i] *= impacts[i];
        }
        return contributions;
    }

    public getOverallContributionsOfOrigins(indicators: IIndicator[]): number[] {
        const r = zeros(this.scalingVector.length);
        for (const indicator of indicators) {
            for (let col = 0; col < r.length; col++) {
                r[col] += this.normD.get(indicator.index, col);
            }
        }
        return r;
    }

    private getNormalizationFactors() {
        // const nfactors = norm10(totals);
        const nfactors = this.normalizationTotals.slice();
        for (let i = 0; i < nfactors.length; i++) {
            if (nfactors[i] === 0) {
                continue;
            }
            nfactors[i] = 1 / nfactors[i];
        }
        return nfactors;
    }
}
