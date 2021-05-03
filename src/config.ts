import { DemandType, ResultPerspective } from "./webapi";
import * as strings from "./util/strings";
import { isNone } from "./util";

/**
 * A common configuration object of our widgets. Often our widgets take the same
 * configuration options regarding the data they present (e.g. the codes of
 * industry sectors or indicators).
 */
export interface Config {

    [key: string]: any;

    /**
     * The ID of the input output model
     */
    model?: string;

    /**
     * An array of sector codes.
     */
    sectors?: string[];

    /**
     * A possible additional array of NAICS sector codes. We translate them to
     * BEA codes when parsing the confiration.
     */
    naics?: string[];

    /**
     * An array of indicator codes.
     */
    indicators?: string[];

    /**
     * In some widgets, e.g. the heatmap, there is a difference between the
     * indicators that are used for sorting and/or the calculation and the
     * indicators that should be displayed. In this case, the `indicator`
     * attribute would contain the codes of the indicators for the
     * calculation/sorting and the `view_indicators` the codes of the indicators
     * that should be displayed.
     */
    view_indicators?: string[];

    /**
     * The result perspective.
     */
    perspective?: ResultPerspective;

    /**
     * The type of the demand vector.
     */
    analysis?: DemandType;

    /**
     * The year of the demand vector.
     */
    year?: number;

    /**
     * An optional location code to filter sectors
     * by location in multi-regional models.
     */
    location?: string;

    /**
     * The number of items a widget should display.
     * This is typically the number of sectors.
     */
    count?: number;

    /**
     * Can be used together with the `count` property
     * to page through a number of items.
     */
    page?: number;

    /**
     * `view=mosaic` is currently used in the industry list widget
     * to switch between a plain sector list or the real heatmap.
     */
    view?: string[];

    /**
     * Indicates if result values should be shown in a widget.
     */
    showvalues?: boolean;

    /**
     * Indicates if result values should be shown in scientific notation or not.
     */
    showscientific?: boolean;

    /**
     * Indicates whether the matrix selector should be shown or not.
     */
    selectmatrix?: boolean;

    /**
     * Indicates whether download links should be shown or not.
     */
    showdownload?: boolean;

    /**
     * Indicates whether code examples should be displayed.
     */
    showcode?: boolean;
}

/**
 * Parses a configuration from the given string. The format is expected to be
 * exactly like in the parameter part of an URL, thus, a set of key-value pairs
 * where the pairs are separated by `&` and the keys from the values by `=`, e.g.
 * "page=42&count=10".
 */
export function parseConfig(s: string): Config {
    if (!s || Array.isArray(s)) {
        return {};
    }
    if (typeof s === "object") {
        return s as Config;
    }
    if (typeof s !== "string") {
        return {};
    }
    const config: Config = {};
    for (const part of s.split("&")) {
        const keyVal = part.split("=");
        if (keyVal.length < 2) {
            continue;
        }
        const key = keyVal[0].trim();
        const val = keyVal[1].trim();

        // things are explicitly set to null,
        // when the value is empty
        if (val === "") {
            config[key] = null;
            continue;
        }

        switch (key) {

            // integers
            case "year":
            case "count":
            case "page":
                try {
                    config[key] = parseInt(val, 10);
                } catch (_) { }
                break;

            // booleans
            case "showvalues":
            case "showcode":
            case "selectmatrix":
            case "showdownload":
            case "showscientific":
                config[key] = strings.eq(val, "true", "1", "yes");
                break;

            // lists
            case "sectors":
            case "indicators":
            case "view_indicators":
            case "naics":
            case "view":
                config[key] = strings.isNullOrEmpty(val)
                    ? []
                    : val.split(",");
                break;

            // enumerations
            case "type":
            case "analysis":
                if (strings.eq(val, "consumption")) {
                    config.analysis = "Consumption";
                } else if (strings.eq(val, "production")) {
                    config.analysis = "Production";
                }
                break;
            case "perspective":
                const p = perspectiveOf(val);
                if (p) {
                    config.perspective = p;
                }
                break;

            default:
                // simply store the strings per default
                // also store unknown things
                config[key] = val;
        }

    }
    return config;
}

function perspectiveOf(val: string): ResultPerspective | null {
    if (!val) {
        return null;
    }
    switch (val.trim().toLowerCase()) {

        case "direct":
        case "direct results":
        case "supply":
        case "supply chain":
            return "direct";

        case "final":
        case "final results":
        case "consumption":
        case "final consumption":
        case "point of consumption":
            return "final";

        case "intermediate":
        case "intermediate results":
            return "intermediate";

        default:
            return null;
    }
}

export function serializeConfig(config: Config | string): string {
    if (!config) {
        return "";
    }
    if (typeof config === "string") {
        return config as string;
    }
    if (Array.isArray(config)) {
        return (config as []).join("&");
    }
    if (typeof config !== "object") {
        return "";
    }
    let s = "";
    for (const key of Object.keys(config)) {
        if (s !== "") {
            s += "&";
        }
        s += key + "=";
        const val = config[key];
        if (isNone(val)) {
            continue;
        }
        if (Array.isArray(val)) {
            s += val.join(",");
            continue;
        }
        s += val;
    }
    return s;
}
