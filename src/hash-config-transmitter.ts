import { Config, ConfigTransmitter, Widget } from "./commons";

export function create() {
    return new HashConfigTransmitter();
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

    private parseConfig(): Config {
        const config: Config = {};
        config.hash = window.location.hash;
        if (!config.hash) {
            return config;
        }
        let feed = config.hash;
        if (feed.startsWith("#")) {
            feed = feed.substring(1);
        }
        const parts = feed.split("&");
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
                default:
                    break;
            }
        }
        return config;
    }

    private updateHash() {
        let hash = "#";
        if (this.config.sectors && this.config.sectors.length > 0) {
            hash += "sectors=" + this.config.sectors.join(",");
        }
        if (this.config.indicators && this.config.indicators.length > 0) {
            hash += "indicators=" + this.config.indicators.join(",");
        }
        window.location.hash = hash;
    }
}