import { DemandType, ResultPerspective } from "./webapi";
import * as strings from "./strings";

/**
 * A common configuration object of our widgets. Often our widgets take
 * the same configuration options regarding the data they present (e.g.
 * the codes of industry sectors or indicators).
 */
export interface Config {

    /**
     * The possible sender of an configuration update.
     */
    source?: Widget;

    /**
     * The full location hash if this configuration was fetched from
     * a location hash (window.location.hash).
     */
    hash?: string;

    /**
     * An array of sector codes.
     */
    sectors?: string[];

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
}

export abstract class Widget {

    private isReady = false;
    private listeners = new Array<(config: Config) => void>();
    private queue = new Array<() => void>();

    update(config: Config) {
        if (!config || config.source === this) {
            return;
        }
        if (!this.isReady) {
            this.queue.push(() => this.handleUpdate(config));
        } else {
            this.handleUpdate(config);
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

    protected fireChange(config: Config) {
        config.source = this;
        for (const fn of this.listeners) {
            fn(config);
        }
    }

    protected async handleUpdate(_: Config) {
    }
}

export interface ConfigTransmitter {

    join(widget: Widget): void;

    update(config: Config): void;
}

export class HashConfigTransmitter implements ConfigTransmitter {

    private widgets = new Array<Widget>();
    private config: Config = {};

    constructor() {
        this.config = this.parseConfig();
        window.onhashchange = () => this.onHashChanged();
        window.addEventListener("popstate", () => this.onHashChanged());
    }

    private onHashChanged() {
        this.config = {
            ...this.config,
            ...this.parseConfig(),
        };
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
            this.config = {
                ...this.config,
                ...config,
            };
            this.updateHash();
        });
    }

    update(config: Config) {
        this.config = {
            ...this.config,
            ...config,
        };
        this.updateHash();
    }

    private parseConfig(): Config {
        const config: Config = {};
        config.hash = window.location.hash;
        if (!config.hash) {
            return config;
        }
        const parts = strings.trimPrefix(decodeURIComponent(config.hash), "#")
            .split("&");
        for (const part of parts) {
            const keyVal = part.split("=");
            if (keyVal.length < 2) {
                continue;
            }
            const key = keyVal[0].trim().toLowerCase();
            const val = keyVal[1].trim();
            if (key.length === 0 || val.length === 0) {
                continue;
            }

            switch (key) {

                case "sectors":
                    config.sectors = val.split(",");
                    break;

                case "indicators":
                    config.indicators = val.split(",");
                    break;

                case "type":
                case "analysis":
                    if (strings.eq(val, "consumption")) {
                        config.analysis = "Consumption";
                    } else if (strings.eq(val, "production")) {
                        config.analysis = "Production";
                    }
                    break;

                case "perspective":
                    const p = getPerspective(val);
                    if (p) {
                        config.perspective = p;
                    }
                    break;

                case "location":
                    config.location = val;
                    break;

                case "year":
                    try {
                        config.year = parseInt(val, 10);
                    } catch (e) {
                        delete config.year;
                    }

                default:
                    break;
            }
        }
        return config;
    }

    private updateHash() {
        const parts = new Array<string>();
        const conf = this.config;
        if (conf.sectors && conf.sectors.length > 0) {
            parts.push("sectors=" + conf.sectors.join(","));
        }
        if (conf.indicators && conf.indicators.length > 0) {
            parts.push("indicators=" + conf.indicators.join(","));
        }
        [
            ["type", conf.analysis],
            ["perspective", conf.perspective],
            ["year", conf.year],
            ["location", conf.location],
        ].forEach(([key, val]) => {
            if (val) {
                parts.push(`${key}=${val}`);
            }
        });
        window.location.hash = "#" + parts.join("&");
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
