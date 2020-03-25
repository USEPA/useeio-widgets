
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
