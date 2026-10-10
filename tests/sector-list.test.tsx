import { render } from "@testing-library/react";
import * as React from "react";
import { act } from "react-dom/test-utils";
import { Config } from "../src/config";
import { ImpactHeader } from "../src/widgets/sector-list/impacts";
import { SectorList } from "../src/widgets/sector-list/sector-list";
import { container, makeIndicators, makeModel, search, tableOf } from "./fixtures/model";

async function renderList(config: Config, onChange?: (c: Config) => void) {
    const { model } = makeModel({ sectors: 30, indicators: 6 });
    const root = container();
    const widget = new SectorList(model, `#${root.id}`);
    if (onChange) {
        widget.onChanged(onChange);
    }
    await act(async () => {
        await widget.update(config);
    });
    return { widget, root };
}

describe("ImpactHeader", () => {

    it("should re-render when the number of indicators changes", () => {
        const config: Config = { view: ["mosaic"] };
        const sorter = { indicators: [] as any[], state: "desc" };
        const view = render(
            <table><thead><tr>
                <ImpactHeader indicators={makeIndicators(2)} onClick={() => null} config={config} sorter={sorter} />
            </tr></thead></table>);
        expect(() => view.rerender(
            <table><thead><tr>
                <ImpactHeader indicators={makeIndicators(4)} onClick={() => null} config={config} sorter={sorter} />
            </tr></thead></table>)).not.toThrow();
        expect(view.container.querySelectorAll("th a").length).toBe(4);
    });
});

describe("SectorList", () => {

    it("should render the same table (regression)", async () => {
        const { root } = await renderList({
            view: ["mosaic", "ranking"],
            count: 5,
            showvalues: true,
            analysis: "Consumption",
        });
        const { header, rows } = tableOf(root);
        expect(header).toEqual(EXPECTED_HEADER);
        expect(rows).toEqual(EXPECTED_ROWS);
    });

    it("should not fire config changes while rendering", async () => {
        const changes: Config[] = [];
        const { root } = await renderList({ all_sectors: true, count: -1 }, c => changes.push(c));
        expect(changes.length).toBe(1);
        expect(changes[0].sectors.length).toBe(30);

        ["s", "se", "sec"].forEach(term => search(root, term));
        expect(changes.length).toBe(1);
    });
});

const EXPECTED_HEADER = [
    "ID", "Name", "Demand [billions]",
    "Impact Potential", "Indicator ACID (ACID)", "Indicator HNC (HNC)",
    "Resource Use", "Indicator ETOX (ETOX)",
    "Chemical Releases", "Indicator HC (HC)",
    "Waste Generated", "Indicator EUTR (EUTR)",
    "Economic & Social", "Indicator GCC (GCC)",
    "Ranking",
];
const EXPECTED_ROWS = [
    ["s12", "Sector 012", "13.000", "", "0.395 kg", "0.831 kg", "", "0.816 kg", "", "0.538 kg", "", "0.867 kg", "", "0.998 kg", "1.884"],
    ["s6", "Sector 006", "7.000", "", "0.987 kg", "0.883 kg", "", "0.389 kg", "", "0.519 kg", "", "0.747 kg", "", "0.893 kg", "1.879"],
    ["s2", "Sector 002", "3.000", "", "0.895 kg", "0.936 kg", "", "0.854 kg", "", "0.649 kg", "", "0.527 kg", "", "0.617 kg", "1.867"],
    ["s26", "Sector 026", "27.000", "", "0.408 kg", "0.773 kg", "", "0.323 kg", "", "0.943 kg", "", "0.797 kg", "", "0.983 kg", "1.833"],
    ["s28", "Sector 028", "29.000", "", "0.947 kg", "0.158 kg", "", "0.415 kg", "", "0.813 kg", "", "0.825 kg", "", "0.912 kg", "1.808"],
];
