import * as React from "react";
import * as ReactDOM from "react-dom";

import { Widget, Config } from "../../";
import { Model, Matrix, Sector } from "../../webapi";
import { ListHeader } from "./list-header";
import * as strings from "../../util/strings";
import * as paging from "../../util/paging";

export class IOList extends Widget {

    A: Matrix;
    sectors: Sector[];
    sectorIndex: { [code: string]: number };

    constructor(
        private model: Model,
        private direction: "inputs" | "outputs",
        private selector: string) {
        super();
    }

    async update(config: Config) {
        if (!this.A) {
            await this.initFields();
        }
        ReactDOM.render(
            <Component
                config={config}
                ranking={this.rankIt(config)} />,
            document.querySelector(this.selector));
    }

    private async initFields() {
        const rawSectors = await this.model.sectors();
        const rawA = await this.model.matrix("A");
        const isMultiRegional = await this.model.isMultiRegional();
        if (!isMultiRegional) {
            this.A = rawA;
            this.sectors = rawSectors;
        } else {
            const { index, sectors } = await this.model.singleRegionSectors();
            this.sectors = sectors;

            // we aggregate the m*m multi-regional matrix to a n*n single
            // region matrix
            const m = rawSectors.length;
            const n = sectors.length;
            this.A = Matrix.zeros(n, n);
            for (let rawRow = 0; rawRow < m; rawRow++) {
                const rowCode = rawSectors[rawRow].code;
                const row = index[rowCode];
                if (row === undefined) {
                    continue;
                }
                for (let rawCol = 0; rawCol < m; rawCol++) {
                    const val = rawA.get(rawRow, rawCol);
                    if (!val) {
                        continue;
                    }
                    const colCode = rawSectors[rawCol].code;
                    const col = index[colCode];
                    if (col === undefined) {
                        continue;
                    }
                    const sum = this.A.get(row, col) + val;
                    this.A.set(row, col, sum);
                }
            }
        }

        // calculate the sector index that maps the sector codes
        // to the corresponding matrix indices
        this.sectorIndex = {};
        this.sectors.reduce((idx, sector) => {
            idx[sector.code] = sector.index;
            return idx;
        }, this.sectorIndex);
    }

    private rankIt(config: Config): [Sector, number][] {

        const indices: number[] = [];
        if (config.sectors) {
            for (const code of config.sectors) {
                const idx = this.sectorIndex[code];
                if (idx !== undefined) {
                    indices.push(idx);
                }
            }
        }

        const ranking: [Sector, number][] = this.sectors.map(
            sector => [sector, 0]);
        if (indices.length > 0) {
            for (const i of indices) {
                const data = this.direction === "inputs"
                    ? this.A.getCol(i)
                    : this.A.getRow(i);
                data.forEach((value, j) => {
                    ranking[j][1] += value;
                });
            }
        }

        // normalize the ranking value to a range [0..1]
        const max = ranking.reduce(
            (m, elem) => Math.max(Math.abs(m), elem[1]), 0);
        if (max > 0) {
            for (const elem of ranking) {
                elem[1] /= max;
            }
        }

        ranking.sort((elem1, elem2) => elem1[1] !== elem2[1]
            ? elem2[1] - elem1[1]
            : strings.compare(elem1[0].name, elem2[0].name)
        );

        return ranking;
    }
}

const Component = (props: {
    config: Config,
    ranking: [Sector, number][],
}) => {

    const [config, setConfig] = React.useState<Config>({
        page: 1,
        count: props.config.count,
    });

    const count = config.count ?
        config.count
        : -1;
    const page = config.page ?
        config.page
        : 1;
    const ranking = paging.select(props.ranking, { page, count });

    const rows = ranking.map(elem => {
        const sector = elem[0];
        const label = `${sector.code} - ${sector.name}`;
        return (
            <tr key={sector.code}>
                <td title={label}
                    style={{
                        borderTop: "lightgray solid 1px",
                        padding: "5px 0px",
                        whiteSpace: "nowrap",
                    }}>
                    {strings.cut(label, 50)}
                </td>
                <td>
                    <svg height="15" width="50"
                        style={{ float: "left", clear: "both" }}>
                        <rect x="0" y="2.5"
                            height="10" fill="#90a4ae"
                            width={50 * (0.05 + 0.95 * elem[1])} />
                    </svg>
                </td>
            </tr>
        );
    });

    return (
        <>
            <table>
                <thead>
                    <tr className="indicator-row">
                        <ListHeader
                            config={config}
                            sectorCount={props.ranking.length}
                            onConfigChange={newConfig => setConfig(
                                { ...config, ...newConfig })}
                            onSearch={_term => { }}
                        />
                        <th></th>
                    </tr>
                </thead>
                <tbody className="sector-list-body">
                    {rows}
                </tbody>
            </table>
        </>
    );
};
