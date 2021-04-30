import { Config } from "../../config";
import { isNone, isNotNone, TMap } from "../../util/util";
import { Sector } from "../../webapi";

/**
 * Get the selected sectors for the IO grid in a map of `sector-code : share`
 * pairs.
 */
export function fromConfig(config: Config, sectors: Sector[]): TMap<number> {
    const s: TMap<number> = {};
    if (!config) {
        return s;
    }

    // collect the sectors shares and disabled sectors from 
    const disabled: string[] = [];
    if (config.sectors) {
        for (const code of config.sectors) {
            const parts = code.split(":");
            if (parts.length < 2) {
                s[code] = 100;
                continue;
            }
            const [sectorCode, share] = parts;
            if (share === "disabled") {
                disabled.push(sectorCode);
                continue;
            }
            try {
                s[sectorCode] = parseInt(share);
            } catch (e) {
                s[sectorCode] = 100;
            }
        }
    }

    // if the naics attribute is set, we select all sectors that are not
    // disabled explicitly
    if (config.naics && config.naics.length > 0) {
        for (const sector of sectors) {
            if (disabled.indexOf(sector.code) >= 0) {
                continue;
            }
            const share = s[sector.code];
            if (isNone(share)) {
                s[sector.code] = 100;
            }
        }
    }

    return s;
}

export function toConfig(
    config: Config, sectors: Sector[], selected: TMap<number>): string[] {

    if (!config.naics || config.naics.length === 0) {
        return Object.keys(selected)
            .map(code => [code, selected[code]])
            .filter(([_, share]) => isNotNone(share))
            // Don't display default share (100)
            .map(([code, share]) => `${code}${share != 100 ? `:${share}` : ``}`);
    }
    return sectors.map(s => [s.code, selected[s.code]])
        .filter(([_, share]) => share !== 100)
        .map(([code, share]) => isNone(share)
            ? `${code}:disabled`
            : `${code}${share != 100 ? `:${share}` : ``}`);
}
