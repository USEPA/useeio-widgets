import { isNone, isNotNone } from "../../util/util";
import { Indicator } from "../../webapi";
import * as strings from "../../util/strings";

/**
 * The row type of the commodity list.
 */
export type Commodity = {
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
        return this._results;
    }

    indicatorResult(c: Commodity): number {
        return !c || !this._results
            ? 0
            : this._results[c.index];
    }

    relativeIndicatorResult(c: Commodity): number {
        return !c || !this._maxResult
            ? 0
            : this.indicatorResult(c) / this._maxResult;
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
        return this._maxResult | 0;
    }


    setSelectedOnly(b: boolean): SortOptions {
        const next = new SortOptions(this);
        next._selectedOnly = b;
        return next;
    }

    swapSelectedOnly(): SortOptions {
        const next = new SortOptions(this);
        next._selectedOnly = !this._selectedOnly;
        return next;
    }

    setSelectedFirst(b: boolean): SortOptions {
        const next = new SortOptions(this);
        next._selectedFirst = b;
        return next;
    }

    swapSelectedFirst(): SortOptions {
        return this._copy(n =>
            n._selectedFirst = !this._selectedFirst);
    }

    setIndicator(indicator: Indicator, results: number[]): SortOptions {
        const next = new SortOptions(this);
        next._indicator = indicator;
        next._results = results;
        next._maxResult = results
            ? results.reduce((max, val) => Math.max(max, Math.abs(val)), 0)
            : 0;
        return next;
    }

    setAlphabetical(): SortOptions {
        const next = new SortOptions(this);
        next._indicator = null;
        next._results = null;
        next._maxResult = 0;
        return next;
    }

    private _copy(f: (next: SortOptions) => void): SortOptions {
        const n = new SortOptions(this);
        f(n);
        return n;
    }

    apply(commodities: Commodity[]): Commodity[] {
        if (!commodities) {
            return [];
        }

        const list = this._selectedOnly
            ? commodities.filter(c => c.selected)
            : commodities;

        return list.sort((c1, c2) => {

            // if selected first and if the selection
            // state is different
            if (this.isSelectedFirst
                && c1.selected !== c2.selected) {
                return c1.selected ? -1 : 1;
            }

            // sort by indicator
            if (this.isByIndicator && this._results) {
                const r1 = this.indicatorResult(c1);
                const r2 = this.indicatorResult(c2);
                return r2 - r1;
            }

            // sort alphabetically by default
            return strings.compare(c1.name, c2.name);

        });
    }
}
