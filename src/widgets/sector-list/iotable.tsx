import * as React from "react";
import { SectorList } from "./sector-list";
import { Config } from "../../";
import * as strings from "../../util/strings";
import { Sector } from "../../webapi";

type Display = "inputs" | "outputs" | "nothing";

export const SectorHeader = (props: {
    widget: SectorList
}) => {

    const w = props.widget;
    if (!w.sectors || w.sectors.length === 0) {
        return <></>;
    }
    if (!w.matrixA || display(w.config) === "nothing") {
        return <></>;
    }

    const items = w.sectors.map(sector =>
        <th key={sector.code} className="io-sector-column-header">
            <div>
                {sector.code} - {strings.cut(sector.name, 50)}
            </div>
        </th>);
    return <>{items}</>;
};

export const InputOutputCells = (props: {
    sector: Sector,
    widget: SectorList
}) => {

    const w = props.widget;
    if (!w.sectors || w.sectors.length === 0) {
        return <></>;
    }
    const view = display(w.config);
    if (!w.matrixA || view === "nothing") {
        return <></>;
    }

    const data = view === "inputs"
        ? w.matrixA.getCol(props.sector.index)
        : w.matrixA.getRow(props.sector.index);

    const items = w.sectors.map(sector => {
        const demand = w.demand[sector.code] || 0;
        const v = data[sector.index] * demand;
        return <td key={sector.code}>
            {w.config.showscientific
                ? v.toExponential(2)
                : v.toFixed(2)}
        </td>;
    });
    return <>{items}</>;
};

function display(config: Config): Display {
    if (!config || !config.view) {
        return "nothing";
    }
    if (strings.isMember("inputs", config.view)) {
        return "inputs";
    }
    return strings.isMember("outputs", config.view)
        ? "outputs"
        : "nothing";
}
