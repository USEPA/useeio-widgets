import { DemandType, ResultPerspective, Model } from "./webapi";

/**
 * A common configuration object of our widgets. Often our widgets take
 * the same configuration options regarding the data they present (e.g.
 * the codes of industry sectors or indicators).
 */
export interface Config {

    [key: string]: any;

    /**
     * The ID of the input output model
     */
    model?: string;

    /**
     * An array of sector codes.
     */
    sectors?: string[];

    /**
     * A possible additional array of NAICS sector codes.
     * We translate them to BEA codes when parsing the
     * confiration.
     */
    naics?: string[];

    /**
     * An array of indicator codes.
     */
    indicators?: string[];

    /**
    * An array of indicator codes for the heatmap that will be displayed.
    */
    view_indicators?: string[];

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

    /**
     * The number of items a widget should display.
     * This is typically the number of sectors.
     */
    count?: number;

    /**
     * Can be used together with the `count` property
     * to page through a number of items.
     */
    page?: number;

    /**
     * `view=mosaic` is currently used in the industry list widget
     * to switch between a plain sector list or the real heatmap.
     */
    view?: string[];

    /**
     * Indicates if result values should be shown in a widget.
     */
    showvalues?: boolean;

    /**
     * Indicates if result values should be shown in scientific notation or not.
     */
    showscientific?: boolean;

    /**
     * Indicates whether the matrix selector should be shown or not.
     */
    selectmatrix?: boolean;

    /**
     * Indicates whether download links should be shown or not.
     */
    showdownload?: boolean;

    /**
     * Indicates whether code examples should be displayed.
     */
    showcode?: boolean;

    /**
     * Optional scoped configurations. Widgets can be combined
     * in scopes. Each scope has then its own configuration
     * state. A scope has a unique name which is added as a
     * prefix to the configuration options in the URL parameters.
     */
    scopes?: { [scope: string]: Config };
}

export interface WidgetArgs {
    model: Model;
    selector: string;
    scope?: string;
}

export abstract class Widget {

    public scope: string;

    private isReady = false;
    private listeners = new Array<(config: Config) => void>();
    private queue = new Array<() => void>();

    update(config: Config) {
        if (!config) {
            return;
        }
        if (!this.isReady) {
            this.queue.push(() => this.handleUpdate(this.flatten(config)));
        } else {
            this.handleUpdate(this.flatten(config));
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

    fireChange(config: Config) {
        let _conf: Config = config;
        if (this.scope) {
            _conf = { scopes: {} };
            _conf.scopes[this.scope] = config;
        }
        for (const fn of this.listeners) {
            fn(_conf);
        }
    }

    protected abstract handleUpdate(_: Config): Promise<void>;

    /**
     * If this widget is associated with a scope, this function creates a new
     * flat configuration object that combines the global configuration with
     * the respective configuration of the widgets scope. Global configuration
     * options are replaced by local, scoped configurations if available.
     */
    private flatten(config: Config): Config {
        if (!config) {
            return {};
        }
        const _conf: Config = { ...config };
        delete _conf.scopes;
        if (!this.scope || !config.scopes) {
            return _conf;
        }
        const scopeConf = config.scopes[this.scope];
        if (!scopeConf) {
            return _conf;
        }
        for (const key of Object.keys(scopeConf)) {
            _conf[key] = scopeConf[key];
        }
        return _conf;
    }
}

/**
 * A widget can join a `ConfigTransmitter` to share configration changes with
 * other widgets and/or to listen to configuration updates.
 */
export interface ConfigTransmitter {

    /**
     * Let the given widget join this transmitter.
     */
    join(widget: Widget): void;

    /**
     * Updates all widgets that joined this transmitter with the given
     * configuration.
     */
    update(config: Config): void;
}

/**
 * Applies the given changes on the given configuration in place. We cannot
 * simply use the spread operator here (`{...config, ...changes}`) as we may
 * have to update nested scopes recursively.
 */
export const updateConfig = (config: Config, changes: Config) => {
    for (const key of Object.keys(changes)) {
        if (key === "scopes") {
            continue;
        }
        config[key] = changes[key];
    }

    // update scopes recursively
    if (!changes.scopes) {
        return;
    }
    if (!config.scopes) {
        config.scopes = {};
    }
    for (const scope of Object.keys(changes.scopes)) {
        const changedScope = changes.scopes[scope];
        if (!changedScope) {
            continue;
        }
        let configScope: Config;
        for (const _scope of Object.keys(config.scopes)) {
            if (scope === _scope) {
                configScope = config.scopes[_scope];
                break;
            }
        }
        if (!configScope) {
            configScope = {};
            config.scopes[scope] = configScope;
        }
        updateConfig(configScope, changedScope);
    }
};
