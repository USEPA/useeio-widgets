import { Config } from "./config";
import { Model } from "./webapi";

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
