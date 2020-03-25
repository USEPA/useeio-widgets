let _endpoint = "https://smmtool.app.cloud.gov/api/";
let _modelID = "USEEIO";
let _apiKey: null | string = null;

export function setModel(id: string) {
    _modelID = id;
}

export function setEndpoint(url: string, apikey: string | null = null) {
    _endpoint = (url.substring(url.length - 1) === "/") ? url : url + "/";
    _apiKey = apikey;
}
