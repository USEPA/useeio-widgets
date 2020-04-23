import { Config, ConfigTransmitter, Widget } from "./commons";
import * as strings from "./strings";

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
            const key = keyVal[0];
            const val = keyVal[1];

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
                        config.analysis = "consumption";
                    } else if (strings.eq(val, "production")) {
                        config.analysis = "production";
                    }
                    break;

                case "perspective":
                    if (strings.eq(val, "direct", "supply", "supply chain")) {
                        config.perspective = "direct";
                    } else if (strings.eq(val, "upstream", "consumption",
                        "point of consumption")) {
                        config.perspective = "upstream";
                    }
                    break;

                default:
                    break;
            }
        }
        return config;
    }

    private updateHash() {
        const parts = new Array<string>();
        if (this.config.sectors && this.config.sectors.length > 0) {
            parts.push("sectors=" + this.config.sectors.join(","));
        }
        if (this.config.indicators && this.config.indicators.length > 0) {
            parts.push("indicators=" + this.config.indicators.join(","));
        }
        if (this.config.analysis) {
            parts.push(`type=${this.config.analysis}`);
        }
        if (this.config.perspective) {
            parts.push(`perspective=${this.config.perspective}`);
        }
        window.location.hash = "#" + parts.join("&");
    }

}