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
     * The result perspective ("direct" or "upstream").
     */
    perspective?: ResultPerspective;

    /**
     * The type of the final demand ("consumption" or "production").
     */
    analysis?: DemandType;
}

/**
 * Describes the `perspective` of a result. This perspective can be "direct"
 * or "upstream". In the SMM tools the "direct" perspective is also called the
 * "supply chain" perspective and the "upstream" perspective is also called
 * the "point of consumption" perspective.
 */
type ResultPerspective = "direct" | "upstream";

/**
 * Describes the type of a demand vector. This is equivalent to the analysis
 * type in the SMM tools. A demand vector of the type "consumption" includes the
 * final demand of households, government, etc. wheras a demand vector of the
 * type "production" focuses on the production of goods and services.
 */
type DemandType = "consumption" | "production";

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

    protected async handleUpdate(config: Config) {
    }
}

export interface ConfigTransmitter {

    join(widget: Widget): void;

    update(config: Config): void;
}
