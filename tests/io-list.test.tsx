import { act } from "react-dom/test-utils";
import { IOList } from "../src/widgets/sector-list/io-list";
import { container, makeModel, search, tableOf } from "./fixtures/model";

async function renderList() {
    const { model } = makeModel({ sectors: 30 });
    const root = container();
    const widget = new IOList(model, "inputs", `#${root.id}`);
    await act(async () => {
        await widget.update({ sectors: ["s0"], count: 5 });
    });
    return root;
}

describe("IOList", () => {

    it("should render the same ranking (regression)", async () => {
        const root = await renderList();
        expect(tableOf(root).rows.map(r => r[0])).toEqual(["s2", "s9", "s20", "s13", "s11"]);
    });

    it("should search in all pages", async () => {
        const root = await renderList();
        search(root, "sector 000");
        expect(tableOf(root).rows.map(r => r[0])).toEqual(["s0"]);
    });
});
