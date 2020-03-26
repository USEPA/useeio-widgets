import { IndicatorGroup } from "./webapi";

export type RGB = [number, number, number];

export function getForIndicatorGroup(group: IndicatorGroup): RGB {
    if (!group) {
        return [0, 0, 0];
    }
    switch (group) {
        case IndicatorGroup.CHEMICAL_RELEASES:
            return [230, 122, 10];
        case IndicatorGroup.ECONOMIC_SOCIAL:
            return [66, 142, 85];
        case IndicatorGroup.IMPACT_POTENTIAL:
            return [160, 0, 7];
        case IndicatorGroup.RESOURCE_USE:
            return [77, 124, 161];
        case IndicatorGroup.WASTE_GENERATED:
            return [101, 74, 139];
        default:
            return [0, 0, 0];
    }
}

export function toCSS(rgb: RGB, alpha?: number): string {
    if (alpha || alpha === 0) {
        return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    } else {
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
}

// currently selected from https://flatuicolors.com/
export function getChartColor(i: number): RGB {
    switch (i) {
        case 0:
            return [198, 60, 65];
        case 1:
            return [21, 192, 191];
        case 2:
            return [155, 89, 182];
        case 3:
            return [52, 152, 219];
        case 4:
            return [46, 204, 113];
        case 5:
            return [241, 196, 15];
        case 6:
            return [230, 126, 34];
        case 7:
            return [52, 73, 94];
        case 8:
            return [192, 57, 43];
        case 9:
            return [22, 160, 133];
        default:
            return [0, 0, 0];
    }
}
