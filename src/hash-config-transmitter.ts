import { Config, ConfigTransmitter, Widget } from "./commons";
import * as strings from "./strings";
import { ResultPerspective } from "./webapi";

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
                        config.year = parseInt(val);
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
        })
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
