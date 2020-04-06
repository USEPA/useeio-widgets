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

export interface Widget {

    update(config: Config): void;

    onChanged(fn: (config: Config) => void): void;

}

export interface ConfigTransmitter {

    join(widget: Widget): void;

}
