import { isNotNone, TMap } from "../../util/util";
import { Indicator } from "../../webapi";
import * as strings from "../../util/strings";

/**
 * Sort the indicators for the `sort-by` menu of the IO Grid.
 */
export function sortIndicators(indicators: Indicator[]): Indicator[] {
    if (!indicators) {
        return [];
    }

    // it was specified, that these indicators should be always
    // at the top of the list ...
    const predef: TMap<number> = {
        "Jobs Supported": 1,
        "Value Added": 2,
        "Energy Use": 3,
        "Land Use": 4,
        "Water Use": 5,
    };

    return indicators.sort((i1, i2) => {
        const name1 = i1.simplename || i1.name;
        const name2 = i2.simplename || i2.name;
        const c1 = predef[name1];
        const c2 = predef[name2];
        if (isNotNone(c1) && isNotNone(c2)) {
            return c1 - c2;
        }
        if (isNotNone(c1)) {
            return -1;
        }
        if (isNotNone(c2)) {
            return 1;
        }
        return strings.compare(name1, name2);
    });
}
