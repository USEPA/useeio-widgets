import { Config, EventBus, updateConfig, Widget } from "../src/widget";

describe("Configuration updates", () => {

    it("should update a simple field", () => {
        const config: Config = {
            page: 1,
        };
        const changes: Config = {
            page: 5,
            count: 2,
        };
        updateConfig(config, changes);
        expect(config.page).toBe(5);
        expect(config.count).toBe(2);
    });

    it("should add a scope", () => {
        const config: Config = {
            page: 1,
        };
        const changes: Config = {
            scopes: {
                "s": {
                    page: 5,
                }
            }
        };
        updateConfig(config, changes);
        expect(config.scopes["s"].page).toBe(5);
    });

    it("should update a scope", () => {
        const config: Config = {
            scopes: {
                "s": {
                    page: 1,
                }
            }
        };
        const changes: Config = {
            scopes: {
                "s": {
                    count: 10,
                }
            }
        };
        updateConfig(config, changes);
        expect(config.scopes["s"].page).toBe(1);
        expect(config.scopes["s"].count).toBe(10);
    });
});

describe("Test the event bus", () => {

    class MockWidget extends Widget {

        config: Config;

        constructor() {
            super();
            this.ready();
        }

        async handleUpdate(config: Config) {
            this.config = config;
        }
    }

    it("should update another widget", () => {
        const w1 = new MockWidget();
        const w2 = new MockWidget();
        const eventBus = new EventBus();
        eventBus.join(w1);
        eventBus.join(w2);
        w1.fireChange({ page: 42 });
        expect(w2.config.page).toBe(42);
    });

});