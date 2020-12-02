import { isNone, isNotNone } from "../../util/util";
import { Indicator } from "../../webapi";

/**
 * Describes the options how the commodities can be sorted in the IO Grid.
 */
export class SortOptions {

    private _selectedOnly: boolean;
    private _selectedFirst: boolean;
    private _indicator?: Indicator;
    private _indicatorResults?: number[];

    get isSelectedOnly() : boolean {
        return this._selectedOnly;
    }

    get isSelectedFirst(): boolean {
        return this._selectedFirst;
    }

    get isByIndicator(): boolean {
        return isNotNone(this._indicator);
    }

    get indicator(): Indicator | undefined {
        return this._indicator;
    }

    get indicatorResults(): number[] | undefined {
        return this._indicatorResults;
    }

    get isAlphabetical() : boolean {
        return isNone(this._indicator);
    }

    constructor(other?: SortOptions) {
        if (!other) {
            // default values
            this._selectedOnly = false;
            this._selectedFirst = true;
        } else {
            this._selectedOnly = other._selectedOnly;
            this._selectedFirst = other._selectedFirst;
            this._indicator = other._indicator;
            this._indicatorResults = other._indicatorResults;
        }
    }

    setSelectedOnly(b: boolean): SortOptions {
        const next = new SortOptions(this);
        next._selectedOnly = b;
        return next;
    }

    setSelectedFirst(b: boolean): SortOptions {
        const next = new SortOptions(this);
        next._selectedFirst = b;
        return next;
    }

    setIndicator(indicator: Indicator, results: number[]): SortOptions {
        const next = new SortOptions(this);
        next._indicator = indicator;
        next._indicatorResults = results;
        return next;
    }

    setAlphabetical(): SortOptions {
        const next = new SortOptions(this);
        next._indicator = null;
        next._indicatorResults = null;
        return next;
    }
}
