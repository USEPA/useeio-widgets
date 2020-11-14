/**
 * This module contains the functions and type definitions for accessing an
 * [USEEIO API](https://github.com/USEPA/USEEIO_API) endpoint. The widgets
 * typically fetch data directly from such an endpoint based on a configuration.
 *
 * @packageDocumentation
 */

/**
 * An instance of this type contains the configuration of an [USEEIO
 * API](https://github.com/USEPA/USEEIO_API) endpoint.
 */
export interface WebApiConfig {

    /**
     * The enpoint URL of the USEEIO API, e.g. `https://path.to/useeio/api`.
     * This can be a relative path when the API data is hosted as JSON files on
     * the same server, e.g. `./api`.
     */
    endpoint: string;

    /**
     * The ID of the input-output model that should be used (an API endpoint
     * can host multiple models which are identified by an unique ID).
     */
    model: string;

    /**
     * An optional API key if such a key is required to access the data of the
     * API endpoint.
     */
    apikey?: string;

    /**
     * Indicates whether the `.json` extension should be added to the request
     * paths. This needs to be set to `true` if the data is hosted as static
     * files on a server (note that in this case calculations are done locally
     * in JavaScript and may require more time and data).
     */
    asJsonFiles?: boolean;

}

/**
 * A class for low level web API calls. The widgets should typically use an
 * instance of the `Model` class for accessing the web API instead as it
 * provides advanced features like typed requests, caching, etc.
 */
export class WebApi {

    /**
     * Creates a new instance based on the given configuration.
     */
    constructor(private conf: WebApiConfig) { }

    /**
     * Returns information about the available models of this API endpoint. This
     * is the only request that has no prefix of the model ID. For all other
     * requests, just use `get(<path>)` that will automatically add the model ID
     * as a prefix to the request path.
     */
    async getModelInfos(): Promise<ModelInfo[]> {
        let url = `${this.conf.endpoint}/models`;
        if (this.conf.asJsonFiles) {
            url += ".json";
        }
        return this._get(url);
    }

    /**
     * Performs a `get` request on a model. The given path should be the
     * fragment after the model ID, e.g. `/sectors`.
     */
    async get<T>(path: string): Promise<T> {
        let url = `${this.conf.endpoint}/${this.conf.model}${path}`;
        if (this.conf.asJsonFiles) {
            url += ".json";
        }
        return this._get(url);
    }

    /**
     * Performs a `post` with the given data on the given path, e.g.
     * `/calculate`.
     */
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

/**
 * An enumeration of the valid indicator groups of the USEEIO API.
 */
export enum IndicatorGroup {
    IMPACT_POTENTIAL = "Impact Potential",
    RESOURCE_USE = "Resource Use",
    WASTE_GENERATED = "Waste Generated",
    ECONOMIC_SOCIAL = "Economic & Social",
    CHEMICAL_RELEASES = "Chemical Releases",
}

/**
 * An environmental, economic, or social indicator of the corresponding USEEIO
 * model.
 */
export interface Indicator {
    /**
     * The ID of the indicator.
     */
    id: string;

    /**
     * The matrix index of the indicator in the corresponding USEEIO model. This
     * is the 0-based row or column of this indicator in the respective matrices
     * of the model.
     */
    index: number;

    /**
     * The full indicator name, e.g. `Acidification potential`.
     */
    name: string;

    /**
     * A short indicator code, e.g. `ACID`.
     */
    code: string;

    /**
     * The unit in which results of this indicator are given.
     */
    unit: string;

    /**
     * The indicator group.
     */
    group: IndicatorGroup;

    /**
     * A simplefied name of the indicator.
     */
    simplename: string;

    /**
     * A simple name for the indicator unit.
     */
    simpleunit: string;
}

/**
 * Contains some meta-data of an USEEIO model.
 */
export interface ModelInfo {

    /**
     * The unique ID of the USEEIO model that is used in the request paths for
     * the web API.
     */
    id: string;

    /**
     * A descriptive name of the model.
     */
    name: string;

    /**
     * The regional scope of the model.
     */
    location: string;

    /**
     * An optional model description.
     */
    description?: string;
}

/**
 * Describes an industry sector in an USEEIO model.
 */
export interface Sector {

    /**
     * The unique ID of the sector.
     */
    id: string;

    /**
     * The matrix index of the sector in the corresponding USEEIO model. This
     * is the 0-based row or column of this sector in the respective matrices
     * of the model.
     */
    index: number;

    /**
     * The sector name.
     */
    name: string;

    /**
     * The classification code of the sector.
     */
    code: string;

    /**
     * Indicates the location of the sector. In a multi-regional model there
     * can be multiple sectors with the same code but different locations.
     */
    location: string;

    /**
     * An optional description of the sector.
     */
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

    /**
     * The ID of the demand vector that is used for the API request.
     */
    id: string;

    /**
     * The year for which the demand vector is valid.
     */
    year: number;

    /**
     * The regional scope of the demand vector.
     */
    location: string;

    /**
     * The general scope of the demand vector (e.g. `Full system`, `Food
     * system`, ...).
     */
    system: string;

    /**
     * The type of the demand vector.
     */
    type: DemandType;
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

/**
 * Describes the perspective of a calculation result:
 *
 * * `direct`: direct contribution results: `D * diag(s)`
 * * `intermediate`: direct + upstream results at each point of the supply chain
 *    (without loop correction): `D * L * diag(s)`
 * * `final`: final results related to the demand vector: `D * L * diag(d)`
 */
export type ResultPerspective =
    "direct"
    | "intermediate"
    | "final";

/**
 * The setup of a calculation request.
 */
export interface CalculationSetup {

    /**
     * The desired result perspective.
     */
    perspective: ResultPerspective;

    /**
     * The demand vector.
     */
    demand: DemandEntry[];
}

/**
 * The calculation result.
 */
export interface Result {

    /**
     * The indicator IDs in matrix order.
     */
    indicators: string[];

    /**
     * The sector IDs in matrix order.
     */
    sectors: string[];

    /**
     * An indicator * sector matrix with the results of the requested
     * perspective (direct, intermediate, or final results).
     */
    data: number[][];

    /**
     * The total result (which is the same for each result perspective).
     */
    totals: number[];
}

/**
 * The currently supported matrices, see:
 * https://github.com/USEPA/USEEIO_API/blob/master/doc/data_format.md
 */
type MatrixName =
    "A"
    | "B"
    | "C"
    | "D"
    | "L"
    | "U";

/**
 * Provides utility functions for working with matrix data.
 */
export class Matrix {

    /**
     * Creates a new dense `m * n` matrix with all entries set to `0`.
     *
     * @param rows The number of rows `m`.
     * @param cols The number of columns `n`.
     */
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

    /**
     * The number of columns of this matrix.
     */
    public readonly cols: number;

    /**
     * The number of rows of this matrix.
     */
    public readonly rows: number;

    /**
     * Creates a new matrix instance from the given data.
     */
    constructor(public readonly data: number[][]) {
        this.rows = data.length;
        this.cols = this.rows === 0 ? 0 : data[0].length;
    }

    /**
     * Get the element at the given row and column: `A[i, j]`.
     */
    public get(row: number, col: number): number {
        return this.data[row][col];
    }

    /**
     * Get the row with the given index `i`: `A[i,:]`.
     */
    public getRow(row: number): number[] {
        return this.data[row].slice();
    }

    /**
     * Get the column with the given index `j`: `A[:,j]`.
     */
    public getCol(col: number): number[] {
        const vals = new Array<number>(this.rows);
        for (let row = 0; row < this.rows; row++) {
            vals[row] = this.get(row, col);
        }
        return vals;
    }

    /**
     * Set the entry at the given row and column to the given value.
     */
    public set(row: number, col: number, val: number) {
        this.data[row][col] = val;
    }

    /**
     * Scales the columns with the given vector `f`: `A * diag(f)`.
     */
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

    /**
     * Scales the rows with the given vector `f`: `diag(f) * A`.
     */
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
     * Performs a matrix-vector-multiplication with the given `v`: `A * v`.
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
 * This type describes a sector aggregation. In case of multi-regional models we
 * have multiple sectors with the same codes and names but different locations.
 * Often we want to aggregate these multi-regional sectors. This type contains
 * the aggregated sectors and an index that maps the sector codes to its new
 * position in the aggregated version which can be then used to aggregate
 * corresponding matrices and results.
 */
type SectorAggregation = {

    /**
     * A map `{sector code -> index}` that maps a sector code to the index of
     * the corresponding sector in the sector array of this aggregation.
     */
    index: { [code: string]: number };

    /**
     * The sectors of this aggregation.
     */
    sectors: Sector[];
};

/**
 * A `Model` instance caches the results of API requests and provides additional
 * functions like aggregating multi-regional sectors of an USEEIO model.
 * Different widgets that access the same web-API should use the same `Model`
 * instance for efficiency reasons.
 */
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

    /**
     * Returns the sectors of the USEEIO model.
     */
    async sectors(): Promise<Sector[]> {
        if (!this._sectors) {
            this._sectors = await this._api.get("/sectors");
        }
        return this._sectors;
    }

    /**
     * Returns true if this is a multi-regional model, i.e. it has sectors with
     * different location codes.
     */
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

    /**
     * Returns the indicators of the USEEIO model.
     */
    async indicators(): Promise<Indicator[]> {
        if (!this._indicators) {
            this._indicators = await this._api.get("/indicators");
        }
        return this._indicators;
    }

    /**
     * Returns the information of the available demand vectors of the USEEIO
     * model.
     */
    async demands(): Promise<DemandInfo[]> {
        if (!this._demandInfos) {
            this._demandInfos = await this._api.get("/demands");
        }
        return this._demandInfos;
    }

    /**
     * Returns the demand vector with the given ID.
     */
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

    /**
     * Returns the matrix with the given name from the model.
     */
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

    /**
     * Get the column of the matrix with the given name from the model.
     */
    async column(matrix: MatrixName, index: number): Promise<number[]> {
        if (!this._conf.asJsonFiles) {
            return this._api.get(`/matrix/${matrix}?col=${index}`);
        }
        const m = await this.matrix(matrix);
        return m.getCol(index);
    }

    /**
     * Runs a calculation for the given setup. Note that this will run the
     * calculation locally if the API is defined to fetch JSON files. Depending
     * on the calculation type this may needs quite some calculation time and
     * data.
     */
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

    /**
     * Creates a sector aggregation in case of a multi-regional model. If this
     * is a single-region model, the sectors are just indexed by their code
     * (which should be unique then).
     */
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