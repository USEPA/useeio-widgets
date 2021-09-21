import { Result, Model, Sector, Indicator } from "../webapi";

export class HeatmapResult {

    private normalized: number[][];
    private shares: number[][];

    static async from(model: Model, result: Result): Promise<HeatmapResult> {
        const [sectors, r] = await aggregateByRegions(result, model);
        return new HeatmapResult(sectors, r);
    }

    private constructor(public sectors: Sector[], public result: Result) {
        this.normalized = result.data.map((row, i) => {
            const total = result.totals[i];
            return row.map(x => {
                return !total || !x
                    ? 0
                    : x / total;
            });
        });

        // calculate the result shares
        const maxIndicatorValues = this.normalized.map(
            row => (!row || row.length === 0)
                ? 0
                : row.reduce((max, x) => Math.max(max, Math.abs(x)), 0)
        );
        this.shares = this.normalized.map((row, i) => {
            const max = maxIndicatorValues[i];
            return (!row || row.length === 0)
                ? []
                : row.map(x => {
                    if (x === 0) {
                        return 0;
                    }
                    if (max === 0) {
                        return x >= 0 ? 1 : -1;
                    }
                    return x / max;
                });
        });
    }

    /**
     * Returns the result value for the given sector and indicator.
     */
    public getResult(indicator: Indicator, sector: Sector): number {
        if (!indicator || !sector) {
            return 0;
        }
        return this.value(this.result.data, indicator.index, sector.index);
    }

    public getShare(indicator: Indicator, sector: Sector): number {
        if (!indicator || !sector) {
            return 0;
        }
        return this.value(this.shares, indicator.index, sector.index);
    }

    public getRanking(indicators: Indicator[]): [Sector, number][] {
        const ranks: [Sector, number][] = [];
        for (const sector of this.sectors) {
            ranks.push([
                sector,
                this.rank(sector, indicators),
            ]);
        }
        ranks.sort((r1, r2) => r2[1] - r1[1]);
        return ranks;
    }

    private rank(sector: Sector, indicators: Indicator[]): number {
        if (!sector || !indicators) {
            return 0;
        }
        const j = sector.index;
        const sum = indicators.reduce((sum, indicator) => {
            const n = this.value(this.normalized, indicator.index, j);
            return sum + Math.pow(n, 2);
        }, 0);
        return Math.sqrt(sum);
    }

    private value(data: number[][], row: number, column: number): number {
        if (!data) {
            return 0;
        }
        if (row < 0 || row >= data.length) {
            return 0;
        }
        const xs = data[row];
        if (column < 0 || column >= xs.length) {
            return 0;
        }
        return xs[column];
    }
}

/**
 * If the given result is a multi-regional model, this function aggregates the
 * given result so that the result columns of the same sector in different
 * regions are summed up to a single column. Together with the aggregated result
 * a corresponding sector array is returned but this sector information should
 * be **never** used for API requests as they describe an artificialy aggregated
 * sector. If the given model describes a single region, the result and sectors
 * are returned without modification.
 */
async function aggregateByRegions(result: Result, model: Model): Promise<[Sector[], Result]> {
    const isMultiRegional = await model.isMultiRegional();
    const sectors = await model.sectors();
    if (!isMultiRegional) {
        return [sectors, result];
    }

    // generate the aggregated sectors and map their
    // codes to their index: code => index
    const { sectors: aggSectors, index } = await model.singleRegionSectors();
    const aggSectorIds = aggSectors.map(s => s.id);

    // aggregate the result matrix
    const data: number[][] = result.data.map(row => {
        const aggRow = new Array(aggSectors.length).fill(0);
        sectors.forEach((sector) => {
            const j = index[sector.code];
            aggRow[j] += row[sector.index];
        });
        return aggRow;
    });

    return [aggSectors, {
        data,
        indicators: result.indicators,
        sectors: aggSectorIds,
        totals: result.totals,
    }];
}
