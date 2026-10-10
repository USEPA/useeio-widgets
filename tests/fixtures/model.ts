import { fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { Indicator, IndicatorGroup, Matrix, Sector, WebModel } from "useeio";
import { DEFAULT_INDICATORS } from "../../src/constants";

const GROUPS = [
    IndicatorGroup.IMPACT_POTENTIAL,
    IndicatorGroup.RESOURCE_USE,
    IndicatorGroup.WASTE_GENERATED,
    IndicatorGroup.ECONOMIC_SOCIAL,
    IndicatorGroup.CHEMICAL_RELEASES,
];

type FakeModelSpec = {
    sectors?: number,
    indicators?: number,
    regions?: string[],
};

function seeded(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

export function makeIndicators(count: number): Indicator[] {
    return DEFAULT_INDICATORS.slice(0, count).map((code, index) => ({
        id: `ind-${code}`,
        index,
        code,
        name: `Indicator ${code}`,
        simplename: `Indicator ${code}`,
        unit: "kg",
        simpleunit: "kg",
        group: GROUPS[index % GROUPS.length],
    }));
}

function makeSectors(count: number, location?: string, offset = 0): Sector[] {
    return Array.from({ length: count }, (_, i) => ({
        id: location ? `s${i}/${location}` : `s${i}`,
        index: offset + i,
        code: `s${i}`,
        name: `Sector ${String(i).padStart(3, "0")}`,
        location,
        description: `Description of sector ${i}`,
    }));
}

function randomMatrix(rows: number, cols: number, rand: () => number): Matrix {
    const data = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.round(rand() * 1000) / 1000));
    return new Matrix(data);
}

/**
 * Creates an in-memory model with deterministic data that implements the parts
 * of `WebModel` used by the widgets.
 */
export function makeModel(spec: FakeModelSpec = {}) {
    const n = spec.sectors ?? 20;
    const k = spec.indicators ?? 6;
    const regions = spec.regions ?? [];
    const multi = regions.length > 1;
    const rand = seeded(42);

    const aggSectors = makeSectors(n);
    const sectors = multi
        ? regions.flatMap((r, ri) => makeSectors(n, r, ri * n))
        : aggSectors;
    const m = sectors.length;
    const indicators = makeIndicators(k);
    const matrices: { [name: string]: Matrix } = {
        A: randomMatrix(m, m, rand),
        D: randomMatrix(k, m, rand),
        N: randomMatrix(k, m, rand),
    };
    const demand = sectors.map(s => ({ sector: s.id, amount: 1e9 * (1 + s.index) }));
    const index: { [code: string]: number } = {};
    aggSectors.forEach((s, i) => index[s.code] = i);

    const model = {
        sectors: async () => sectors.map(s => ({ ...s })),
        indicators: async () => indicators.map(i => ({ ...i })),
        isMultiRegional: async () => multi,
        singleRegionSectors: async () => ({ sectors: aggSectors.map(s => ({ ...s })), index }),
        matrix: async (name: string) => matrices[name],
        findDemand: async () => "demand",
        demand: async () => demand,
        calculate: async () => ({
            indicators: indicators.map(i => i.code),
            sectors: sectors.map(s => s.id),
            data: matrices.N.data,
            totals: indicators.map(() => 1),
        }),
    };
    return { model: model as unknown as WebModel, matrices, sectors, indicators };
}

export function container(): HTMLElement {
    const div = document.createElement("div");
    div.id = `c${Math.random().toString(36).slice(2)}`;
    document.body.appendChild(div);
    return div;
}

export function tableOf(root: HTMLElement) {
    const header = Array.from(root.querySelectorAll("thead th"))
        .map(th => th.textContent.trim());
    const rows = Array.from(root.querySelectorAll("tbody tr"))
        .map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim()));
    return { header, rows };
}

export function search(root: HTMLElement, term: string, nth = 0) {
    const input = root.querySelectorAll("input[type=text]")[nth];
    act(() => {
        fireEvent.change(input, { target: { value: term } });
    });
}

export const flush = () => new Promise<void>(resolve => setTimeout(resolve, 50));
