import { act } from "react-dom/test-utils";
import { Config } from "../src/config";
import { IOGrid } from "../src/widgets/iogrid/iogrid";
import { container, flush, makeModel, search } from "./fixtures/model";

async function renderGrid(config: Config, spec = {}) {
    const fake = makeModel({ sectors: 30, ...spec });
    const root = container();
    const grid = new IOGrid(fake.model, `#${root.id}`);
    await act(async () => {
        await grid.update(config);
        await flush();
    });
    return { ...fake, root, grid };
}

const namesOf = (root: HTMLElement) => Array.from(root.querySelectorAll(".MuiDataGrid-root"))
    .map(grid => Array.from(grid.querySelectorAll(".MuiDataGrid-row [data-field=name] p:first-child"))
        .map(p => p.textContent));

describe("IOGrid", () => {

    it("should render the same lists (regression)", async () => {
        const { root } = await renderGrid({ sectors: ["s0"], count: 5 });
        expect(namesOf(root)).toEqual([
            ["Sector 002", "Sector 009", "Sector 020", "Sector 013", "Sector 011"],
            ["Sector 000", "Sector 001", "Sector 002", "Sector 003", "Sector 004"],
            ["Sector 006", "Sector 012", "Sector 026", "Sector 021", "Sector 011"],
        ]);
    });

    it("should filter the upstream list on search", async () => {
        const { root } = await renderGrid({ sectors: ["s0"], count: 5 });
        search(root, "sector 000");
        await act(flush);
        expect(namesOf(root)[0]).toEqual(["Sector 000"]);
    });

    it("should select all commodities without mutating the config", async () => {
        const config: Config = { count: 5 };
        const { root } = await renderGrid(config);
        expect(config.sectors).toBeUndefined();
        const checked = root.querySelectorAll(".commodityCheckbox input:checked");
        expect(checked.length).toBe(5);
    });

    it("should aggregate direct impacts of multi-regional models", async () => {
        const { grid, matrices, sectors, indicators } = await renderGrid(
            { sectors: ["s0"], count: 5 }, { regions: ["A", "B"] });
        const expected = new Array(30).fill(0);
        sectors.forEach(s => expected[parseInt(s.code.slice(1))] += matrices.D.get(0, s.index));
        const actual = grid.getIndicatorResults(indicators[0]);
        expected.forEach((v, i) => expect(actual[i]).toBeCloseTo(v, 6));
    });
});
