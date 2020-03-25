
export class WebApi {

    private endpoint: string;
    private modelID: string;
    private apiKey: null | string = null;

    constructor(
        endpoint: string,
        modelID: string,
        apikey?: string) {
        this.endpoint = endpoint;
        this.modelID = modelID;
        this.apiKey = apikey ? apikey : null;
    }

    public async get<T>(path: string): Promise<T> {
        console.log("call API", path);

        // prepare the request
        const req = new XMLHttpRequest();
        req.open("GET", `${this.endpoint}/${this.modelID}${path}`);
        req.setRequestHeader(
            "Content-Type",
            "application/json;charset=UTF-8");
        req.setRequestHeader(
            "max-age",
            "86400",
        )
        if (this.apiKey) {
            req.setRequestHeader(
                "x-api-key", this.apiKey);
        }

        // create the promise
        return new Promise<T>((resolve, reject) => {
            req.onload = () => {
                if (req.status === 200) {
                    try {
                        const t: T = JSON.parse(req.responseText);
                        resolve(t);
                    } catch (err) {
                        reject("failed to parse response for: "
                            + path + ": " + err);
                    }
                } else {
                    reject(`request ${path} failed: ${req.statusText}`)
                }
            }
            req.send();
        });
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

export interface IDemandEntry {
    sector: string;
    amount: number;
}

export interface CalculationSetup {
    perspective: string;
    demand: IDemandEntry[];
}

export interface Result {
    indicators: string[];
    sectors: string[];
    data: number[][];
    totals: number[];
}

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
}
