import * as React from "react";
import * as ReactDOM from "react-dom";
import { Widget, Config } from "../widget";

/**
 * Mnemonics for the different matrices:
 *
 * D : direct result matrix based on 1 USD for each sector
 * U : matrix with upstream totals based on 1 USD for each sector
 * RD: direct result matrix based on a demand vector
 * RU: matrix with upstream totals based on a demand vector
 */
type Matrix = "D" | "U" | "RD" | "RU";

/**
 * A widget for selecting the underlying matrix of a heatmap.
 */
export class MatrixSelector extends Widget {

    constructor(private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        const matrix = matrixOf(config);
        ReactDOM.render(
            <Component
                selected={matrix}
                onChange={(m) => this.fireChange(update(config, m))} />,
            document.querySelector(this.selector)
        );
    }
}

/**
 * Determine the matrix type from the given configuration.
 */
function matrixOf(config: Config): Matrix {
    if (!config || !config.perspective)
        return "RU";
    if (config.perspective === "direct") {
        return !config.analysis
            ? "D"
            : "RD";
    }
    return !config.analysis
        ? "U"
        : "RU";
}

/**
 * Update the configuration based on the selected matrix.
 */
function update(config: Config, matrix: Matrix): Config {
    const conf = !config
        ? {}
        : { ...config };
    if (!matrix)
        return conf;

    // clear the analysis type for 1 USD based matrices
    if (matrix === "D" || matrix === "U") {
        delete conf.analysis;
        conf.perspective = matrix === "D"
            ? "direct"
            : "final";
        return conf;
    }

    // set the analysis type for result matrices to
    // Concumption if it is not present yet.
    if (!conf.analysis) {
        conf.analysis = "Consumption";
    }
    conf.perspective = matrix === "RD"
        ? "direct"
        : "final";
    return conf;
}

function labelOf(matrix: Matrix): string {
    switch (matrix) {
        case "D":
            return "Matrix D";
        case "U":
            return "Matrix U";
        case "RD":
            return "Direct result";
        case "RU":
            return "Upstream result";
    }
}

const Component = (props: {
    selected: Matrix,
    onChange: (matrix: Matrix) => void
}) => {

    const options = ["D", "U", "RD", "RU"].map((m: Matrix) => {
        return (
            <option value={m} key={m}>
                {labelOf(m)}
            </option>
        );
    });

    return (
        <div>
            <div>
                <label>Matrix</label>
                <select value={props.selected}
                    onChange={e => props.onChange(e.target.value as Matrix)}>
                    {options}
                </select>
            </div>
        </div>
    );
};
