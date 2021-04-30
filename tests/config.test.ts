import { parseConfig } from "../src/config";

describe("Parse configurations", () => {

    it("should parse integer attributes", () => {
        const s = "year=2021&count=10&page=42";
        const config = parseConfig(s);
        expect(config.year).toBe(2021);
        expect(config.count).toBe(10);
        expect(config.page).toBe(42);
    });

    it("should pass through simple string attributes", () => {
        const s = "model=USEEIOv2.0&location=US";
        const config = parseConfig(s);
        expect(config.model).toBe("USEEIOv2.0");
        expect(config.location).toBe("US");
    });

    it("should collect unknown attribites", () => {
        const s = "unknown=2&dontknow=Some,List";
        const config = parseConfig(s);
        expect(config["unknown"]).toBe("2");
        expect(config["dontknow"]).toBe("Some,List");
    });

    it("should parse known boolean values", () => {
        const s = "showvalues=1&showcode=true&selectmatrix=yes"
            + "&showdownload=0&showscientific=false";
        const config = parseConfig(s);
        expect(config.showvalues).toBe(true);
        expect(config.showcode).toBe(true);
        expect(config.selectmatrix).toBe(true);
        expect(config.showdownload).toBe(false);
        expect(config.showscientific).toBe(false);
    });

    it("should parse lists", () => {
        const s = "sectors=1,2&indicators=3,4&view_indicators=5,6"
            + "&naics=7,8&view=9,10";
        const config = parseConfig(s);
        expect(config.sectors).toEqual(["1", "2"]);
        expect(config.indicators).toEqual(["3", "4"]);
        expect(config.view_indicators).toEqual(["5", "6"]);
        expect(config.naics).toEqual(["7", "8"]);
        expect(config.view).toEqual(["9", "10"]);
    });

    it("should detect enumeration values", () => {
        const s = "analysis=consumption&perspective=supply chain";
        const config = parseConfig(s);
        expect(config.analysis).toBe("Consumption");
        expect(config.perspective).toBe("direct");
    });


});
