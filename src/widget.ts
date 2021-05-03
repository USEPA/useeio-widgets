import { Config } from "./config";
import { Model } from "./webapi";

export interface WidgetArgs {
    model: Model;
    selector: string;
}

/**
 * A widget is a user interface component that displays data or configuration
 * options of an input-output model. Widgets can be configured and updated via
 * `Config` objects. Also, some widgets can change such configurations and
 * listeners can be attached to widgets to listen to such `Config` changes (e.g.
 * for updating other widgets.)
 */
export abstract class Widget {

    private _listeners = new Array<(config: Config) => void>();

    /**
     * Updates this widget based on the given configuration options.
     * 
     * @param config the new configuration options of this widget.
     */
    abstract update(config: Config): Promise<void>;

    /**
     * Registers a callback function for listening to configuration changes of
     * this widget.
     *
     * @param fn the function that is called when the configuration of this
     *           widget changed.
     */
    onChanged(fn: (config: Config) => void) {
        if (typeof fn !== "function") {
            return;
        }
        this._listeners.push(fn);
    }

    /**
     * Fires a configuration change to the attached listeners.
     * 
     * @param config the updated configuration
     */
    fireChange(config: Config) {
        for (const fn of this._listeners) {
            fn(config);
        }
    }
}
