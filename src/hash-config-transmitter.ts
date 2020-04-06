import { Config, ConfigTransmitter, Widget } from "./commons";

export function create() {
    return new HashConfigTransmitter();
}

export class HashConfigTransmitter implements ConfigTransmitter {

    private widgets = new Array<Widget>();

    constructor() {
        window.onhashchange = () => {
            const config = this.parseConfig()
            for (const widget of this.widgets) {
                widget.update(config);
            }
        };
    }

    clearAll() {
        window.location.hash = "";
    }

    join(widget: Widget) {
        this.widgets.push(widget);
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
}