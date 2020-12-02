import { isNone, isNotNone } from "../../util/util";
import { Indicator } from "../../webapi";

/**
 * The row type of the commodity list.
 */
type Commodity = {
    id: string,
    index: number,
    name: string,
    code: string,
    selected: boolean,
    value: number,
    description?: string,
};


/**
 * Describes the options how the commodities can be sorted in the IO Grid.
 */
export class SortOptions {

    private _selectedOnly: boolean;
    private _selectedFirst: boolean;
    private _indicator?: Indicator;
    private _results?: number[];
    private _maxResult?: number;

    constructor(other?: SortOptions) {
        if (!other) {
            // default values
            this._selectedOnly = false;
            this._selectedFirst = true;
        } else {
            this._selectedOnly = other._selectedOnly;
            this._selectedFirst = other._selectedFirst;
            this._indicator = other._indicator;
            this._results = other._results;
            this._maxResult = other._maxResult;
        }
    }

    get isSelectedOnly(): boolean {
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

    indicatorResult(c: Commodity): number {
        return !c || !this._indicatorResults
            ? 0
            : this._indicatorResults[c.index];
    }

    get indicatorUnit(): string {
        const indicator = this._indicator;
        return !indicator
            ? ""
            : indicator.simpleunit || indicator.unit;
    }

    get isAlphabetical(): boolean {
        return isNone(this._indicator);
    }

    get maxIndicatorResult(): number {
        return !this._indicatorResults
            ? 0
            : this._indicatorResults.reduce(
                (max, val) => Math.max(max, Math.abs(val)), 0);
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

    apply(commodities: Commodity[]): Commodity[] {
        if (!commodities) {
            return [];
        }
        let list = this._selectedOnly
            ? commodities.filter(c => c.selected)
            : commodities;

        return list;
    }
}
