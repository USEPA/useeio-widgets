import { Config } from "./config";

export function create() {
    return new HashConfig();
}

export class HashConfig {

    private listeners = new Array<(config: Config) => void>();

    constructor() {
        window.onhashchange = () => {
            const config = this.parseConfig()
            for (const listener of this.listeners) {
                listener(config);
            }
        };
    }

    clearAll() {
        window.location.hash = "";
    }

    onChanged(consumer: (config: Config) => void) {
        this.listeners.push(consumer);
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