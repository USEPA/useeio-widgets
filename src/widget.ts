import { DemandType, ResultPerspective, Model } from "./webapi";
import * as strings from "./util/strings";
import * as naics from "./naics";

/**
 * A common configuration object of our widgets. Often our widgets take
 * the same configuration options regarding the data they present (e.g.
 * the codes of industry sectors or indicators).
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
     * A possible additional array of NAICS sector codes.
     * We translate them to BEA codes when parsing the
     * confiration.
     */
    naics?: string[];

    /**
     * An array of indicator codes.
     */
    indicators?: string[];

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
     * `view=mosaic` is currently used in the heatmap widget
     * to switch between a plain sector list or the real heatmap.
     */
    view?: string;

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

    /**
     * Optional scoped configurations. Widgets can be combined
     * in scopes. Each scope has then its own configuration
     * state. A scope has a unique name which is added as a
     * prefix to the configuration options in the URL parameters.
     */
    scopes?: { [scope: string]: Config };
}

export interface WidgetArgs {
    model: Model;
    selector: string;
    scope?: string;
}

export abstract class Widget {

    public scope: string;

    private isReady = false;
    private listeners = new Array<(config: Config) => void>();
    private queue = new Array<() => void>();

    update(config: Config) {
        if (!config) {
            return;
        }
        if (!this.isReady) {
            this.queue.push(() => this.handleUpdate(this.flatten(config)));
        } else {
            this.handleUpdate(this.flatten(config));
        }
    }

    protected ready() {
        this.isReady = true;
        if (this.queue.length === 0) {
            return;
        }
        const fn = this.queue.pop();
        fn();
    }

    onChanged(fn: (config: Config) => void) {
        this.listeners.push(fn);
    }

    fireChange(config: Config) {
        let _conf: Config = config;
        if (this.scope) {
            _conf = { scopes: {} };
            _conf.scopes[this.scope] = config;
        }
        for (const fn of this.listeners) {
            fn(_conf);
        }
    }

    protected async handleUpdate(_: Config) {
    }

    /**
     * If this widget is associated with a scope, this function creates a new
     * flat configuration object that combines the global configuration with
     * the respective configuration of the widgets scope. Global configuration
     * options are replaced by local, scoped configurations if available.
     */
    private flatten(config: Config): Config {
        if (!config) {
            return {};
        }
        const _conf: Config = { ...config };
        delete _conf.scopes;
        if (!this.scope || !config.scopes) {
            return _conf;
        }
        const scopeConf = config.scopes[this.scope];
        if (!scopeConf) {
            return _conf;
        }
        for (const key of Object.keys(scopeConf)) {
            _conf[key] = scopeConf[key];
        }
        return _conf;
    }
}

export interface ConfigTransmitter {

    join(widget: Widget): void;

    update(config: Config): void;
}

export class UrlConfigTransmitter implements ConfigTransmitter {

    private widgets = new Array<Widget>();
    private config: Config = {};

    constructor() {
        this.config = parseUrlConfig({ withScripts: true });
        window.onhashchange = () => this.onHashChanged();
        window.addEventListener("popstate", () => this.onHashChanged());
    }

    /**
     * Returns the current configuration of this transmitter.
     */
    public get(): Config {
        return { ...this.config };
    }

    /**
     * Updates the configation of this transmitter if the given object contains
     * properties that are not already defined. Only if there is at least one
     * such property, an update is fired.
     */
    public updateIfAbsent(conf: Config) {
        if (!conf) return;
        const next: Config = { ...this.config };

        // set the values of c2 in c1 if they are missing in c1
        const sync = (c1: Config, c2: Config) => {
            let needsUpdate = false;
            for (const key of Object.keys(c2)) {
                if (key === "scopes") continue;
                if (!c1[key]) {
                    c1[key] = c2[key];
                    needsUpdate = true;
                }
            }
            if (!c2.scopes) {
                return needsUpdate;
            }
            if (!c1.scopes) {
                c1.scopes = { ...c2.scopes };
                return true;
            }
            // sync scope configs recursively
            for (const scope of Object.keys(c2.scopes)) {
                const cc1 = c1.scopes[scope];
                const cc2 = c2.scopes[scope];
                if (!cc2) {
                    continue;
                }
                if (!cc1) {
                    c1.scopes[scope] = { ...cc2 };
                    needsUpdate = true;
                    continue;
                }
                if (sync(cc1, cc2)) {
                    needsUpdate = true;
                }
            }
            return needsUpdate;
        };

        if (sync(next, conf)) {
            this.update(next);
        }
    }

    private onHashChanged() {
        this.config = parseUrlConfig();
        for (const widget of this.widgets) {
            widget.update(this.config);
        }
    }

    clearAll() {
        window.location.hash = "";
    }

    join(widget: Widget) {
        this.widgets.push(widget);
        widget.update(this.config);
        widget.onChanged((config) => {
            this.update(config);
        });
    }

    update(config: Config) {
        const next: Config = { ...this.config };
        for (const key of Object.keys(config)) {
            if (key === "scopes") {
                continue;
            }
            next[key] = config[key];
        }

        // update scopes
        if (config.scopes) {
            if (!next.scopes) {
                next.scopes = { ...config.scopes };
            } else {
                for (const scope of Object.keys(config.scopes)) {
                    const confScope = config.scopes[scope];
                    const nextScope = next.scopes[scope];
                    if (!confScope) {
                        continue;
                    }
                    if (!nextScope) {
                        next.scopes[scope] = { ...confScope };
                        continue;
                    }
                    for (const key of Object.keys(confScope)) {
                        nextScope[key] = confScope[key];
                    }
                }
            }
        }
        this.config = next;
        this.updateHash();
    }

    private updateHash() {

        const str = (conf: Config, scope?: string) => {
            const parts = new Array<string>();
            const urlParam = (key: string, val: any) => scope
                ? parts.push(`${scope}-${key}=${val}`)
                : parts.push(`${key}=${val}`);

            // add lists
            const lists = [
                "sectors",
                "indicators",
                "naics"
            ];
            for (const list of lists) {
                const val = conf[list] as string[];
                if (val && val.length > 0) {
                    urlParam(list, val.join(","));
                }
            }

            // add simple types
            for (const key of Object.keys(conf)) {
                if (lists.indexOf(key) >= 0
                    || key === "scopes") {
                    continue;
                }
                const val = conf[key];
                if (val) {
                    urlParam(key, val);
                }
            }

            // add scopes
            if (conf.scopes) {
                for (const _scope of Object.keys(conf.scopes)) {
                    const scopeConf = conf.scopes[_scope];
                    if (scopeConf) {
                        parts.push(str(scopeConf, _scope));
                    }
                }
            }
            return parts.join("&");
        };

        window.location.hash = "#" + str(this.config);
    }
}

/**
 * Parses the URL configuration from the browser URL (window.location)
 * and optionally also from the URLs of included JavaScript files. Hash
 * parameters have a higher priority than normal URL parameters; the
 * browser URL has a higher priority that the URLs of included JavaScript
 * files.
 */
function parseUrlConfig(what?: { withScripts?: boolean }): Config {
    const config: Config = {};
    const urls: string[] = [
        window.location.href,
    ];
    if (what && what.withScripts) {
        const scriptTags = document.getElementsByTagName("script");
        for (let i = 0; i < scriptTags.length; i++) {
            const url = scriptTags.item(i).src;
            if (url) {
                urls.push(url);
            }
        }
    }
    for (const url of urls) {
        const hashParams = getParameters(getHashPart(url));
        const otherParams = getParameters(getParameterPart(url));
        updateConfig(config, hashParams);
        updateConfig(config, otherParams);
    }
    return config;
}

/**
 * Updates the given configuration with the given URL parameters if and only
 * if the respective parameters are not already defined in that configuration.
 */
function updateConfig(config: Config, urlParams: [string, string][]) {

    // create scoped configurations lazily
    const _conf = (scope?: string) => {
        if (!scope) {
            return config;
        }
        if (!config.scopes) {
            config.scopes = {};
        }
        let c = config.scopes[scope];
        if (!c) {
            c = {};
            config.scopes[scope] = c;
        }
        return c;
    };

    // update if a value is not set yet
    const _update = (key: string, value: any, scope?: string) => {
        const c = _conf(scope);
        if (c[key]) {
            return;
        }
        c[key] = value;
    };

    for (const [key, val] of urlParams) {
        if (!key || !val) {
            continue;
        }
        let scope: string | undefined;
        let _key = key;
        const dashIdx = key.indexOf("-");
        if (dashIdx > 0) {
            scope = key.substring(0, dashIdx);
            _key = key.substring(dashIdx + 1);
        }

        switch (_key) {

            // simple string values
            case "model":
            case "location":
            case "view":
                _update(_key, val, scope);
                break;

            // integers
            case "year":
            case "count":
            case "page":
                try {
                    const _int = parseInt(val, 10);
                    _update(_key, _int, scope);
                } catch (_) { }
                break;

            // booleans
            case "showvalues":
            case "showcode":
            case "selectmatrix":
            case "showdownload":
            case "showscientific":
                const _bool = strings.eq(val, "true", "1", "yes");
                _update(_key, _bool, scope);
                break;

            // lists
            case "sectors":
            case "indicators":
            case "naics":
                _update(_key, val.split(","), scope);
                break;

            case "type":
            case "analysis":
                if (strings.eq(val, "consumption")) {
                    _update("analysis", "Consumption", scope);
                } else if (strings.eq(val, "production")) {
                    _update("analysis", "Production", scope);
                }
                break;

            case "perspective":
                const p = getPerspective(val);
                if (p) {
                    _update("perspective", p, scope);
                }
                break;

            default:
                break;
        }
    }
}

/**
 * Try to determine the result perspecitve from the value in the URL hash.
 */
function getPerspective(val: string): ResultPerspective | null {
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

function getParameters(urlPart: string): [string, string][] {
    if (!urlPart)
        return [];
    const pairs = urlPart.split("&");
    const params: [string, string][] = [];
    for (const pair of pairs) {
        const keyVal = pair.split("=");
        if (keyVal.length < 2) {
            continue;
        }
        const key = keyVal[0].trim().toLowerCase();
        const val = keyVal[1].trim();
        params.push([key, val]);
    }
    return params;
}

function getHashPart(url: string): string | null {
    if (!url)
        return null;
    const parts = url.split("#");
    return parts.length < 2
        ? null
        : parts[parts.length - 1];
}

function getParameterPart(url: string): string | null {
    if (!url)
        return null;
    let part = url;

    // remove the hash part
    let parts = url.split("#");
    if (parts.length > 1) {
        part = parts[parts.length - 2];
    }

    // get the parameter part
    parts = part.split("?");
    return parts.length < 2
        ? null
        : parts[1];
}