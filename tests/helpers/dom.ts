import "global-jsdom/register";

for (const [prop, value] of [["offsetHeight", 600], ["offsetWidth", 800], ["clientHeight", 600], ["clientWidth", 800]] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value });
}
HTMLElement.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, bottom: 600, right: 800, width: 800, height: 600, toJSON: () => null });
