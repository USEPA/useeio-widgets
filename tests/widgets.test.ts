import { Config, SimpleConfigTransmitter, Widget } from "../src/";

describe("Configuration updates", () => {
    it("should update a simple field", () => {
        const config: Config = {
            page: 1,
        };
        const changes: Config = {
            page: 5,
            count: 2,
        };
        const updated = { ...config, ...changes };
        expect(updated.page).toBe(5);
        expect(updated.count).toBe(2);
    });
});


class MockWidget extends Widget {

    config: Config;

    async update(config: Config) {
        this.config = config;
    }
}

describe("Test the event bus", () => {

    it("should update another widget", () => {
        const w1 = new MockWidget();
        const w2 = new MockWidget();
        const config = new SimpleConfigTransmitter();
        config.join(w1);
        config.join(w2);
        w1.fireChange({ page: 42 });
        expect(w2.config.page).toBe(42);
    });

    it("should handle defaults", () => {
        const w = new MockWidget();
        const config = new SimpleConfigTransmitter();
        config.withDefaults({ page: 21, count: 5 });
        config.join(w);
        expect(w.config.page).toBe(21);
        expect(w.config.count).toBe(5);
        config.update({ count: 10 });
        expect(w.config.page).toBe(21);
        expect(w.config.count).toBe(10);
    });

    it("should handle updateIfAbsent", () => {
        const w = new MockWidget();
        const config = new SimpleConfigTransmitter();
        config.withDefaults({ page: 21 });
        config.join(w);
        config.updateIfAbsent({ page: 11, count: 5 });
        expect(w.config.page).toBe(21);
        expect(w.config.count).toBe(5);
    });
});
