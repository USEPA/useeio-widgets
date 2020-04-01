interface Config {
    hash?: string;
    sectors?: string[];
    indicators?: string[];

}

export class HashConfig {

    private listeners = new Array<(config: Config)  => void>();

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

    onUpdate(consumer: (config: Config)  => void) {
        this.listeners.push(consumer);
    }

    private parseConfig(): Config {
        let hash = window.location.hash;
        if (!hash){
            return {};
        }
        const config: Config = {};
        config.hash = hash;
        return config;
    }
}