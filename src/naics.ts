import { NaicsMap, Sector } from "useeio";

/**
 * Maps the given NAICS codes to BEA codes and then filters the given sectors
 * to only include sectors with a matching BEA code.
 */
export function filterByNAICS(
    naicsCodes: string | string[], sectors: Sector[], naicsMap: NaicsMap): Sector[] {
    if (!sectors ) {
        return [];
    }
    if (!naicsCodes || naicsCodes.length === 0 || !naicsMap) {
        return sectors;
    }
    const sectorsCode = naicsMap.toBea(naicsCodes);
    return sectors.filter(sector => sectorsCode.includes(sector.code));
}
