import { Config, updateConfig } from "../src/widget";

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
