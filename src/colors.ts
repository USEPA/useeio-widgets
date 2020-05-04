import { IndicatorGroup } from "./webapi";

export type RGB = [number, number, number];

export function forIndicatorGroup(group: IndicatorGroup, alpha?: number): string {
    if (!group) {
        return css([0, 0, 0]);
    }
    switch (group) {
        case IndicatorGroup.CHEMICAL_RELEASES:
            return css([230, 122, 10], alpha);
        case IndicatorGroup.ECONOMIC_SOCIAL:
            return css([66, 142, 85]);
        case IndicatorGroup.IMPACT_POTENTIAL:
            return css([160, 0, 7]);
        case IndicatorGroup.RESOURCE_USE:
            return css([77, 124, 161]);
        case IndicatorGroup.WASTE_GENERATED:
            return css([101, 74, 139]);
        default:
            return css([0, 0, 0]);
    }
}

export function css(i: number | RGB, alpha?: number) {
    const rgb = Array.isArray(i) ? i : getRGB(i);
    return alpha || alpha === 0
        ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
        : `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function getRGB(i: number): RGB {
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
