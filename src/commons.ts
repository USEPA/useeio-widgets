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

}

export abstract class Widget {

    private isReady = false;
    private listeners = new Array<(config: Config) => void>();
    private queue = new Array<() => void>();

    update(config: Config) {
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

    protected handleUpdate(config: Config){
    }
}

export interface ConfigTransmitter {

    join(widget: Widget): void;

}
