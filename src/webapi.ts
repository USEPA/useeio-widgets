import { thresholdSturges } from "d3";

/**
 * The configuration of the web api.
 */
export interface WebApiConfig {

    /**
     * The enpoint URL of the API.
     */
    endpoint: string;

    /**
     * The ID of the EEIO model to use.
     */
    model: string;

    /**
     * An optional API key.
     */
    apikey?: string;

    /**
     * Indicates whether the `.json` extension should be added
     * to the request paths. This needs to be set to `true` if
     * we load the data just as static files from a server.
     */
    asJsonFiles?: boolean;

}

/**
 * A class for low level web API calls. Use the Model class for typed requests
 * that also support caching etc.
 */
export class WebApi {

    constructor(private conf: WebApiConfig) { }

    /**
     * This is the only get request that has no prefix of the model ID. For all
     * other request, just use `get(<path>)` that will automatically add the
     * model ID as a prefix.
     */
    async getModelInfos(): Promise<ModelInfo[]> {
        let url = `${this.conf.endpoint}/models`;
        if (this.conf.asJsonFiles) {
            url += ".json";
        }
        return this._get(url);
    }

    /**
     * Perform a get request on a model. The given path should be the fragment
     * after the model ID, e.g. `/sectors`.
     */
    async get<T>(path: string): Promise<T> {
        let url = `${this.conf.endpoint}/${this.conf.model}${path}`;
        if (this.conf.asJsonFiles) {
            url += ".json";
        }
        return this._get(url);
    }

    async post<T>(path: string, data: any): Promise<T> {
        const url = `${this.conf.endpoint}/${this.conf.model}${path}`;
        const req = this._request("POST", url);
        return new Promise<T>((resolve, reject) => {
            req.onload = () => {
                if (req.status === 200) {
                    try {
                        const t: T = JSON.parse(req.responseText);
                        resolve(t);
                    } catch (err) {
                        reject("failed to parse response for POST "
                            + url + ": " + err);
                    }
                } else {
                    reject(`request POST ${url} failed: ${req.statusText}`);
                }
            };
            req.send(JSON.stringify(data));
        });
    }

    private async _get<T>(url: string): Promise<T> {
        const req = this._request("GET", url);
        return new Promise<T>((resolve, reject) => {
            req.onload = () => {
                if (req.status === 200) {
                    try {
                        const t: T = JSON.parse(req.responseText);
                        resolve(t);
                    } catch (err) {
                        reject("failed to parse response for: "
                            + url + ": " + err);
                    }
                } else {
                    reject(`request ${url} failed: ${req.statusText}`);
                }
            };
            req.send();
        });
    }

    private _request(method: "GET" | "POST", url: string): XMLHttpRequest {
        const req = new XMLHttpRequest();
        req.open(method, url);
        req.setRequestHeader(
            "Content-Type",
            "application/json;charset=UTF-8");
        if (this.conf.apikey) {
            req.setRequestHeader(
                "x-api-key", this.conf.apikey);
        }
        return req;
    }
}

export enum IndicatorGroup {
    IMPACT_POTENTIAL = "Impact Potential",
    RESOURCE_USE = "Resource Use",
    WASTE_GENERATED = "Waste Generated",
    ECONOMIC_SOCIAL = "Economic & Social",
    CHEMICAL_RELEASES = "Chemical Releases",
}

export interface Indicator {
    id: string;
    index: number;
    name: string;
    code: string;
    unit: string;
    group: IndicatorGroup;
}

export interface ModelInfo {
    id: string;
    name: string;
    location: string;
    description: string;
}

export interface Sector {
    id: string;
    index: number;
    name: string;
    code: string;
    location: string;
    description?: string;
}

/**
 * Describes the type of a demand vector. This is equivalent to the analysis
 * type in the SMM tools. A demand vector of the type "Consumption" includes the
 * final demand of households, government, etc. wheras a demand vector of the
 * type "Production" focuses on the production of goods and services.
 */
export type DemandType = "Consumption" | "Production";

/**
 * DemandInfo contains the meta data of a standard demand vector. The request
 * `<endpoint>/<model id>/demands` returns a list of `DemandInfo` objects.
 */
export interface DemandInfo {
    id: string;
    year: number;
    location: string;
    system: string;
    type: "Consumption" | "Production";
}

/**
 * DemandEntry describes an entry in a specific demand vector. The request
 * `<endpoint>/<model id>/demands/<demand id>` returns the demand vector with
 * the given ID as list of such entry objects.
 */
export interface DemandEntry {
    sector: string;
    amount: number;
}

export type ResultPerspective =
    "direct"
    | "intermediate"
    | "final";

export interface CalculationSetup {
    perspective: ResultPerspective;
    demand: DemandEntry[];
}

export interface Result {
    indicators: string[];
    sectors: string[];
    data: number[][];
    totals: number[];
}

type MatrixName =
    "A"
    | "B"
    | "C"
    | "D"
    | "L"
    | "U";

export class Matrix {

    public static zeros(rows: number, cols: number): Matrix {
        const data = new Array<number[]>(rows);
        for (let row = 0; row < rows; row++) {
            const v = new Array<number>(cols);
            for (let col = 0; col < cols; col++) {
                v[col] = 0;
            }
            data[row] = v;
        }
        return new Matrix(data);
    }

    public readonly cols: number;
    public readonly rows: number;

    constructor(public readonly data: number[][]) {
        this.rows = data.length;
        this.cols = this.rows === 0 ? 0 : data[0].length;
    }

    public get(row: number, col: number): number {
        return this.data[row][col];
    }

    public getRow(row: number): number[] {
        return this.data[row].slice();
    }

    public getCol(col: number): number[] {
        const vals = new Array<number>(this.rows);
        for (let row = 0; row < this.rows; row++) {
            vals[row] = this.get(row, col);
        }
        return vals;
    }

    public set(row: number, col: number, val: number) {
        this.data[row][col] = val;
    }

    public scaleColumns(f: number[]): Matrix {
        const m = Matrix.zeros(this.rows, this.cols);
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const v = this.get(row, col) * f[col];
                m.set(row, col, v);
            }
        }
        return m;
    }

    public scaleRows(f: number[]): Matrix {
        const m = Matrix.zeros(this.rows, this.cols);
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const v = this.get(row, col) * f[row];
                m.set(row, col, v);
            }
        }
        return m;
    }

    /**
     * Performs a matrix vector multiplication with the given vector.
     */
    public multiplyVector(v: number[]): number[] {
        return this.data.map(row => row.reduce((sum, x, j) => {
            const vj = v[j];
            if (x && vj) {
                return sum + (x * vj);
            }
            return sum;
        }, 0));
    }
}

/**
 * This type describes a sector aggregation. In case of multi-regional models
 * we have multiple sectors with the same codes and names but different
 * locations. Often we want to aggregate these multi-regional sectors. This
 * type contains the aggregated sectors and an index that maps the sector
 * codes to its new position in the aggregated version which can be then used
 * to aggregate corresponding matrices and results.
 */
type SectorAggregation = {
    index: { [code: string]: number };
    sectors: Sector[];
};

export class Model {

    private _api: WebApi;

    private _sectors: Sector[];
    private _indicators: Indicator[];
    private _demandInfos: DemandInfo[];
    private _matrices: { [index: string]: Matrix };
    private _demands: { [index: string]: DemandEntry[] };
    private _totalResults: { [demandID: string]: number[] };
    private _isMultiRegional: boolean;
    private _sectorAggregation: SectorAggregation;

    constructor(private _conf: WebApiConfig) {
        this._api = new WebApi(_conf);
        this._matrices = {};
        this._demands = {};
        this._totalResults = {};
    }

    async sectors(): Promise<Sector[]> {
        if (!this._sectors) {
            this._sectors = await this._api.get("/sectors");
        }
        return this._sectors;
    }

    async isMultiRegional(): Promise<boolean> {
        if (typeof this._isMultiRegional === "boolean") {
            return this._isMultiRegional;
        }
        const sectors = await this.sectors();
        let loc;
        for (const sector of sectors) {
            if (!sector.location) {
                continue;
            }
            if (!loc) {
                loc = sector.location;
                continue;
            }
            if (loc !== sector.location) {
                this._isMultiRegional = true;
                return true;
            }
        }
        this._isMultiRegional = false;
        return false;
    }

    async indicators(): Promise<Indicator[]> {
        if (!this._indicators) {
            this._indicators = await this._api.get("/indicators");
        }
        return this._indicators;
    }

    async demands(): Promise<DemandInfo[]> {
        if (!this._demandInfos) {
            this._demandInfos = await this._api.get("/demands");
        }
        return this._demandInfos;
    }

    async demand(id: string): Promise<DemandEntry[]> {
        let d = this._demands[id];
        if (d) {
            return d;
        }
        d = await this._api.get(`/demands/${id}`);
        this._demands[id] = d;
        return d;
    }

    /**
     * Get the ID of the (first) demand vector for the given specification.
     */
    async findDemand(spec: Partial<DemandInfo>): Promise<string | null> {
        const demands = await this.demands();
        const demand = demands.find(d => {
            if (spec.id && d.id !== spec.id) {
                return false;
            }
            if (spec.type && d.type !== spec.type) {
                return false;
            }
            if (spec.system && d.system !== spec.system) {
                return false;
            }
            /* TODO: location codes in the sectors are not the same
             * as in the demand vectors.
            if (spec.location && d.location !== spec.location) {
                return false;
            }
            */
            if (spec.year && d.year !== spec.year) {
                return false;
            }
            return true;
        });
        return demand ? demand.id : null;
    }

    async matrix(name: MatrixName): Promise<Matrix> {
        let m = this._matrices[name];
        if (m) {
            return m;
        }
        const data: number[][] = await this._api.get(`/matrix/${name}`);
        m = new Matrix(data);
        this._matrices[name] = m;
        return m;
    }

    async column(matrix: MatrixName, index: number): Promise<number[]> {
        if (!this._conf.asJsonFiles) {
            return this._api.get(`/matrix/${matrix}?col=${index}`);
        }
        const m = await this.matrix(matrix);
        return m.getCol(index);
    }

    async calculate(setup: CalculationSetup): Promise<Result> {
        if (!this._conf.asJsonFiles) {
            return this._api.post("/calculate", setup);
        }

        // try to run the calculation on JSON files
        const indicators = await this.indicators();
        const sectors = await this.sectors();

        // prepare the demand vector
        const demand = new Array(sectors.length).fill(10);
        const sectorIdx: { [id: string]: number } = {};
        sectors.reduce((idx, sector) => {
            idx[sector.id] = sector.index;
            return idx;
        }, sectorIdx);
        setup.demand.forEach(entry => {
            const i = sectorIdx[entry.sector];
            if (i === 0 || i) {
                demand[i] = entry.amount;
            }
        });

        // calculate the perspective result
        const U = await this.matrix("U");
        let data: number[][];
        let L: Matrix, s: number[];
        switch (setup.perspective) {
            case "direct":
                L = await this.matrix("L");
                s = L.multiplyVector(demand);
                const D = await this.matrix("D");
                data = D.scaleColumns(s).data;
                break;
            case "intermediate":
                L = await this.matrix("L");
                s = L.multiplyVector(demand);
                data = U.scaleColumns(s).data;
                break;
            case "final":
                data = U.scaleColumns(demand).data;
                break;
            default:
                throw new Error(`unknown perspective ${setup.perspective}`);
        }

        return {
            data,
            indicators: indicators.map(indicator => indicator.code),
            sectors: sectors.map(sector => sector.id),
            totals: U.multiplyVector(demand),
        };
    }

    /**
     * Get the total indicator result for the given demand vector and
     * perspective. If the demand vector is specified by an ID, results are
     * cached.
     */
    async getTotalResults(demand: string | DemandEntry[]): Promise<number[]> {
        if (Array.isArray(demand)) {
            const setup: CalculationSetup = {
                perspective: "final",
                demand,
            };
            return (await this.calculate(setup)).totals;
        }

        // try to get a cached result
        const totals = this._totalResults[demand];
        if (totals && totals.length > 0)
            return totals;

        // calculate and cache the result
        const demandVector = await this.demand(demand);
        const result = await this.calculate({
            perspective: "final",
            demand: demandVector,
        });
        if (!result)
            return [];
        this._totalResults[demand] = result.totals;
        return result.totals;
    }

    async singleRegionSectors(): Promise<SectorAggregation> {
        if (this._sectorAggregation) {
            return this._sectorAggregation;
        }
        const sectors = await this.sectors();
        const multiRegional = await this.isMultiRegional();

        // no aggregation in case of single-region models
        if (!multiRegional) {
            const index = sectors.reduce((idx, sector) => {
                idx[sector.code] = sector.index;
                return idx;
            }, {} as { [code: string]: number });
            this._sectorAggregation = {
                index, sectors
            };
            return this._sectorAggregation;
        }

        // aggregate the sectors
        const aggSectors: Sector[] = [];
        const aggIndex: { [code: string]: number } = {};
        let i = 0;
        for (const s of sectors) {
            if (aggIndex[s.code] === undefined) {
                aggIndex[s.code] = i;
                const agg: Sector = {
                    code: s.code,
                    id: s.code,
                    index: i,
                    name: s.name,
                    description: s.description,
                    location: null,
                };
                aggSectors[i] = agg;
                i++;
            }
        }
        this._sectorAggregation = {
            index: aggIndex,
            sectors: aggSectors,
        };
        return this._sectorAggregation;
    }
}