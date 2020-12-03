import { isNone, isNoneOrEmpty } from "../../util/util";
import { Indicator } from "../../webapi";
import * as strings from "../../util/strings";
import { IOGrid } from "./iogrid";
import { Config } from "../../widget";

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
    private _indicators: Indicator[];
    private _results?: number[];
    private _maxResult?: number;

    constructor(readonly grid: IOGrid, other?: SortOptions) {
        if (!other) {
            // default values
            this._selectedOnly = false;
            this._selectedFirst = true;
        } else {
            this._selectedOnly = other._selectedOnly;
            this._selectedFirst = other._selectedFirst;
            this._indicators = other._indicators;
            this._results = other._results;
            this._maxResult = other._maxResult;
        }
    }

    static create(grid: IOGrid, config: Config): SortOptions {
        const opts = new SortOptions(grid);
        if (isNoneOrEmpty(config?.indicators))
            return opts;
        const indicators = grid.getSortedIndicators()
            .filter(i => config.indicators.indexOf(i.code) >= 0);
        return opts.setIndicators(indicators);
    }

    get isSelectedOnly(): boolean {
        return this._selectedOnly;
    }

    get isSelectedFirst(): boolean {
        return this._selectedFirst;
    }

    get isByIndicators(): boolean {
        return isNone(this._indicators)
            ? false
            : this._indicators.length > 0;
    }

    get indicatorCodes(): string[] | null {
        return isNoneOrEmpty(this._indicators)
            ? null
            : this._indicators
                .map(i => i.code)
                .sort();
    }

    get hasSingleIndicator(): boolean {
        return isNone(this._indicators)
            || this.indicators.length !== 1
            ? false
            : true;
    }

    get indicators(): Indicator[] {
        return isNone(this._indicators)
            ? []
            : this._indicators.slice(0);
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
        if (!this.hasSingleIndicator) {
            return "";
        }
        const indicator = this._indicators[0];
        return !indicator
            ? ""
            : indicator.simpleunit || indicator.unit;
    }

    get isAlphabetical(): boolean {
        return !this.isByIndicators;
    }

    get maxIndicatorResult(): number {
        return this._maxResult | 0;
    }

    swapSelectedOnly(): SortOptions {
        return this._copy(n =>
            n._selectedOnly = !this._selectedOnly);
    }

    swapSelectedFirst(): SortOptions {
        return this._copy(n =>
            n._selectedFirst = !this._selectedFirst);
    }

    isSelected(indicator: Indicator): boolean {
        if (!indicator || !this._indicators)
            return false;
        for (const i of this._indicators) {
            if (i === indicator)
                return true;
        }
        return false;
    }

    swapSelectionOf(indicator: Indicator): SortOptions {
        if (!indicator) {
            return this;
        }

        // create the new indicator list
        const indicators: Indicator[] = [];
        const current = this._indicators || [];
        let found = false;
        for (const i of current) {
            if (i === indicator) {
                found = true;
                continue;
            }
            indicators.push(i);
        }

        if (!found) {
            indicators.push(indicator);
        }

        return this.setIndicators(indicators);
    }

    setIndicators(indicators: Indicator[]): SortOptions {
        if (isNoneOrEmpty(indicators)) {
            return this.setAlphabetical();
        }

        const absmax = (nums: number[]): number =>
            nums
                ? nums.reduce((max, val) => Math.max(max, Math.abs(val)), 0)
                : 0;

        // calculate the combined results
        let results: number[];
        if (indicators.length === 1) {
            results = this.grid.getIndicatorResults(indicators[0]);
        } else {
            for (const i of indicators) {
                const r = this.grid.getIndicatorResults(i);
                const m = absmax(r);
                results = results
                    ? results.map((total, i) => total + (m ? r[i] / m : 0))
                    : r.map((val) => m ? val / m : 0);
            }
        }

        return this._copy(n => {
            n._indicators = indicators;
            n._results = results;
            n._maxResult = absmax(results);
        });
    }

    setAlphabetical(): SortOptions {
        return this._copy(n => {
            n._indicators = null;
            n._results = null;
            n._maxResult = 0;
        });
    }

    private _copy(f: (next: SortOptions) => void): SortOptions {
        const n = new SortOptions(this.grid, this);
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
            if (this.isByIndicators && this._results) {
                const r1 = this.indicatorResult(c1);
                const r2 = this.indicatorResult(c2);
                return r2 - r1;
            }

            // sort alphabetically by default
            return strings.compare(c1.name, c2.name);

        });
    }
}
