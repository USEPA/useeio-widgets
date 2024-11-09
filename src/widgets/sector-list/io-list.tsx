import { TablePagination } from "@material-ui/core";
import * as React from "react";
import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import { Config, Widget } from "../../";
import { ifNone } from "../../util";
import * as paging from "../../util/paging";
import * as strings from "../../util/strings";
import { Matrix, WebModel, Sector, Tensor } from "useeio";
import { ListHeader } from "./list-header";
import { otherSorter, TableHeader } from "./sector-list";


export class IOList extends Widget {

    A: Matrix;
    sectors: Sector[];
    sectorIndex: { [code: string]: number };

    constructor(
        private model: WebModel,
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
        const rawA = await this.model.matrix(Tensor.A);
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
    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(ifNone(props.config.count, 10));
    const [sorter, setSorter] = useState<otherSorter>(null);

    const onChangePage = (event:React.MouseEvent<HTMLButtonElement, MouseEvent>,page: number) => {
        setPage(page);
    };

    // Update the pagination settings on config count changes
    useEffect(() => {
        if (props.config.count !== undefined && props.config.count != pageSize) {
            setPageSize(props.config.count);
            setPage(0);
        }
    }, [props.config.count]);

    // Update the sort order for sector name, id or demand
    const updateSorter = (name: string) => {
        if (!sorter || sorter.name != name) {
            setSorter({ name: name, state: "desc" });
        } else {
            let state;
            if (sorter.state === "desc") {
                state = "asc";
                setSorter({ ...sorter, state: state });
            } else if (sorter.state === "asc") {
                setSorter(null);
            }
        }
    };

    let ranking = props.ranking;

    if (sorter) {
        let factor = 1;
        if (sorter.state === "asc") {
            factor = -1;
        }
        if (sorter.name === "name") {
            ranking.sort(([s1], [s2]) => s2.name.localeCompare(s1.name) * factor);
        } else if (sorter.name === "id") {
            ranking.sort(([s1], [s2]) => s2.code.localeCompare(s1.code) * factor);
        }
    } else {
        // Sort by rank
        ranking.sort(([_s1, rank1], [_s2, rank2]) => (rank2 - rank1));
    }

    ranking = paging.select(ranking, { page: page + 1, count: pageSize });

    if (searchTerm) {
        ranking = ranking.filter(([s]) => strings.search(s.name, searchTerm) >= 0);
    }
    const rows = ranking.map(elem => {
        const sector = elem[0];
        return (
            <tr key={sector.code} style={{ height: 30 }}>
                <td
                    style={{
                        borderTop: "lightgray solid 1px",
                        padding: "5px 0px",
                        whiteSpace: "nowrap",
                    }}>
                    {sector.code}
                </td>
                <td title={sector.name}
                    style={{
                        borderTop: "lightgray solid 1px",
                        padding: "5px 0px",
                        whiteSpace: "nowrap",
                    }}>
                    {strings.cut(sector.name, 50)}
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
            <ListHeader
                onSearch={(term) => setSearchTerm(term)}
            />
            <table>
                <thead>
                    <tr className="indicator-row">
                        <TableHeader code={"id"} label="ID" sorter={sorter} updateOtherSorter={updateSorter} />
                        <TableHeader code={"name"} label="Name" sorter={sorter} updateOtherSorter={updateSorter} />
                    </tr>
                </thead>
                <tbody className="sector-list-body">
                    {rows}
                </tbody>
            </table>
            <TablePagination
                style={{ position: "relative", float: "left" }}
                component="div"
                count={props.ranking.length}
                page={page}
                rowsPerPage={pageSize}
                rowsPerPageOptions={[]}
                onPageChange={onChangePage}
            />
        </>
    );
};
