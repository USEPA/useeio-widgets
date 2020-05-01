import { Matrix, Sector, Model, Indicator } from "../webapi";
import { zeros } from "./cals";

export class SectorAnalysis {

    private normU: Matrix | null = null;
    private normD: Matrix | null = null;
    private _scalingVector: number[] | null = null;
    private _purchaseVector: number[] | null = null;

    constructor(
        public sector: Sector,
        public model: Model,
        public normalizationTotals: number[],
    ) {
        const nfactors = this.getNormalizationFactors();
        this.normU = ioModel.U.scaleColumns(purchases).scaleRows(nfactors);
        this.normD = ioModel.D.scaleColumns(scalingVector).scaleRows(nfactors);
    }

    async getEnvironmentalProfile(directOnly = false): Promise<number[]> {
        const matrix = directOnly
            ? this.model.matrix("D")
            : this.model.matrix("U");
        const profile = (await matrix).getCol(this.sector.index);
        return profile.map((x, i) => {
            const total = this.normalizationTotals[i];
            return !x || !total
                ? 0
                : x / total;
        });
    }

    /**
     * A partition contains the indicator results of a sector analysis related
     * to 1 USD output broken into a part that is related to the `direct`
     * operations of a sector and a part that is related to the `upstream`
     * (supply chain) of that sector.
     */
    async getPartition(): Promise<{
        totals: number[], direct: number[], upstream: number[],
    }> {
        const D = this.model.matrix("D");
        const U = this.model.matrix("U");
        const direct = (await D).getCol(this.sector.index);
        const totals = (await U).getCol(this.sector.index);
        const upstream = totals.map((total, i) => total - direct[i]);
        return { totals, direct, upstream };
    }

    /**
     * A regionalized partition is the same as the partition result but the
     * supply chain part is further divided into an in-region and out-of-region
     * part.
     */
    async getRegionalizedPartition(): Promise<{
        totals: number[],
        direct: number[],
        upstreamInRegion: number[],
        upstreamOutOfRegion: number[],
    }> {

        // if the model is not multi-regional, return a simple partition
        const isMultiRegional = await this.model.isMultiRegional();
        if (!isMultiRegional) {
            const p = await this.getPartition();
            return {
                totals: p.totals,
                direct: p.direct,
                upstreamInRegion: p.upstream,
                upstreamOutOfRegion: zeros(p.upstream.length),
            };
        }

        // calculate the partition from the scaled direct results
        // to correctly assign the upstream contributions to the
        // respective location
        const s = await this.scalingVector();
        const G = (await this.model.matrix("D")).scaleColumns(s);
        const totals = zeros(G.rows);
        const direct = zeros(G.rows);
        const upstreamInRegion = zeros(G.rows);
        const upstreamOutOfRegion = zeros(G.rows);

        const location = this.sector.location;
        const sectors = await this.model.sectors();
        for (let row = 0; row < G.rows; row++) {
            for (let col = 0; col < G.cols; col++) {
                const value = G.get(row, col);
                if (!value) {
                    continue;
                }
                totals[row] += value;
                if (col === this.sector.index) {
                    direct[row] += value;
                    continue;
                }
                const sector = sectors[col];
                if (sector.location === location) {
                    upstreamInRegion[row] += value;
                } else {
                    upstreamOutOfRegion[row] += value;
                }
            }
        }

        return {
            totals,
            direct,
            upstreamInRegion,
            upstreamOutOfRegion,
        };
    }

    public getPurchaseContributions(indicator: Indicator): number[] {
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

    /**
     * The scaling vector of the sector j of this analysis is the column j of
     * the Leontief inverse.
     */
    async scalingVector(): Promise<number[]> {
        if (this._scalingVector) {
            return this._scalingVector;
        }
        this._scalingVector = await this.model.column("L", this.sector.index);
        return this._scalingVector;
    }

    async purchaseVector(): Promise<number[]> {
        if (this._purchaseVector) {
            return this._purchaseVector;
        }
        this._purchaseVector = await this.model.column("A", this.sector.index);
        return this._purchaseVector;
    }
}
