
export class WebApi {

    endpoint = "https://smmtool.app.cloud.gov/api";
    modelID = "USEEIO";
    apiKey: null | string = null;

    public async get<T>(path: string): Promise<T> {

        // prepare the request
        const req = new XMLHttpRequest();
        req.open("GET", this.endpoint + path);
        req.setRequestHeader(
            "Content-Type",
            "application/json;charset=UTF-8");
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