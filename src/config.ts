import { DemandType, ResultPerspective } from "./webapi";

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

        switch (key) {

            // integers
            case "year":
            case "count":
            case "page":
                try {
                    config[key] = parseInt(val, 10);
                } catch (_) { }
                break;

            default:
                // per default simply store the strings
                config[key] = val;
        }

    }
    return config;
}

