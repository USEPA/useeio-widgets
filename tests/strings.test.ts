import * as strings from "../src/util/strings";

describe("Compare lists of strings", () => {

    it("should undefined != ['some']", () => {
        expect(strings.areListsEqual(undefined, ["some"])).toBe(false);
        expect(strings.areListsNotEqual(undefined, ["some"])).toBe(true);
    });

    it("should undefined != []", () => {
        expect(strings.areListsEqual(undefined, [])).toBe(false);
        expect(strings.areListsNotEqual(undefined, [])).toBe(true);
    });

    it("should undefined == null", () => {
        expect(strings.areListsEqual(undefined, null)).toBe(true);
        expect(strings.areListsNotEqual(undefined, null)).toBe(false);
    });

    it("should [] == []", () => {
        expect(strings.areListsEqual([], [])).toBe(true);
        expect(strings.areListsNotEqual([], [])).toBe(false);
    });

    it("should [] != ['some']", () => {
        expect(strings.areListsEqual([], ["some"])).toBe(false);
        expect(strings.areListsNotEqual([], ["some"])).toBe(true);
    });

    it("should ['a', 'b'] == ['b', 'a']", () => {
        expect(strings.areListsEqual(["a", "b"], ["b", "a"])).toBe(true);
        expect(strings.areListsNotEqual(["a", "b"], ["b", "a"])).toBe(false);
    });

});