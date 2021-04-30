import { parseConfig } from "../src/config";

describe("Parse configurations", () => {

    it("should parse integer attributes", () => {
        const s = "year=2021&count=10&page=42";
        const config = parseConfig(s);
        expect(config.year).toBe(2021);
        expect(config.count).toBe(10);
        expect(config.page).toBe(42);
    });

});
