import * as React from "react";
import * as ReactDOM from "react-dom";
import { Checkbox, Grid, Slider, Tooltip, Typography } from "@material-ui/core";
import { DataGrid, ColDef, PageChangeParams } from "@material-ui/data-grid";

import { Matrix, Model, Sector } from "../webapi";
import { Config, Widget } from "../widget";
import * as strings from "../util/strings";
import { TMap, ifNone, isNotNone } from "../util/util";

/**
 * The row type of the commodity list.
 */
type Commodity = {
    id: string,
    name: string,
    code: string,
    selected: boolean,
    value: number,
};

/**
 * The row type of the input or output list.
 */
type IOFlow = {
    id: string,
    name: string,
    ranking: number,
};

/**
 * A widget with 3 columns: inputs (upstream flows), commodities, and outputs
 * (downstream flows). The inputs and outputs are computed based on the
 * commodity selection and the direct coefficients matrix `A`. 
 */
export class IOGrid extends Widget {

    private techMatrix: Matrix;
    private sectors: Sector[];
    private sectorIndex: { [code: string]: number };

    constructor(
        private model: Model,
        private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        if (!this.techMatrix) {
            await this.initialize();
        }

        // render the three columns:
        // inputs | commodities | outputs
        ReactDOM.render(
            <Grid container spacing={3}>
                <Grid item style={{ width: "30%", height: 500 }}>
                    <Typography variant="h6" component="span">
                        Upstream
                    </Typography>
                    <IOList
                        config={config}
                        widget={this}
                        direction="input" />
                </Grid>
                <Grid item style={{ width: "40%", height: 500 }}>
                    <Typography variant="h6" component="span">
                        Commodities
                    </Typography>
                    <CommodityList
                        config={config}
                        sectors={this.sectors}
                        widget={this} />
                </Grid>
                <Grid item style={{ width: "30%", height: 500 }}>
                    <Typography variant="h6" component="span">
                        Downstream
                    </Typography>
                    <IOList
                        config={config}
                        widget={this}
                        direction="output" />
                </Grid>
            </Grid>,
            document.querySelector(this.selector)
        );
    }

    private async initialize() {
        const rawSectors = await this.model.sectors();
        const rawA = await this.model.matrix("A");
        const isMultiRegional = await this.model.isMultiRegional();

        if (!isMultiRegional) {
            this.techMatrix = rawA;
            this.sectors = rawSectors;
        } else {

            // in case of multi-regional model, we need aggregated the
            // m*m multi-regional matrix A to a n*n single region matrix
            // TODO: this needs to consider sector shares so that the
            // resulting columns are based on one unit of output! e.g.,
            // a demand vector could be used to calculate these shares
            const { index, sectors } = await this.model.singleRegionSectors();
            this.sectors = sectors;

            const m = rawSectors.length;
            const n = sectors.length;
            this.techMatrix = Matrix.zeros(n, n);
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
                    const sum = this.techMatrix.get(row, col) + val;
                    this.techMatrix.set(row, col, sum);
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
        this.sectors.sort((s1, s2) => strings.compare(s1.name, s2.name));
    }

    /**
     * Computes an input or output ranking based on the given sector
     * configuration. 
     */
    rank(config: Config, direction: "input" | "output"): IOFlow[] {

        // compute the sector index and scaling factor pairs
        const pairs: [number, number][] = [];
        if (config.sectors) {
            for (const s of config.sectors) {
                const parts = s.split(":");
                const code = parts[0];
                const factor = parts.length < 2
                    ? 1.0
                    : parseInt(parts[1]) / 100;

                const idx = this.sectorIndex[code];
                if (isNotNone(idx)) {
                    pairs.push([idx, factor]);
                }
            }
        }

        // initialize the ranking; not that the sectors
        // may are sorted by name, so we use the sector
        // indices for the matrix -> sector -> ranking
        // mappings below
        const n = this.sectors.length;
        const ranking: [Sector, number][] = new Array(n);
        for (const sector of this.sectors) {
            ranking[sector.index] = [sector, 0];
        }

        // put the scaled values into the rankings
        for (const pair of pairs) {
            const data = direction === "input"
                ? this.techMatrix.getCol(pair[0])
                : this.techMatrix.getRow(pair[0]);
            const factor = pair[1];
            data.forEach((value, i) => {
                ranking[i][1] += factor * value;
            });
        }

        // normalize the ranking value to a range [0..1]
        const max = ranking.reduce(
            (m, elem) => Math.max(Math.abs(m), elem[1]), 0);
        if (max > 0) {
            for (const elem of ranking) {
                elem[1] /= max;
            }
        }

        // sort the ranking
        ranking.sort((elem1, elem2) => elem1[1] !== elem2[1]
            ? elem2[1] - elem1[1]
            : strings.compare(elem1[0].name, elem2[0].name)
        );

        // map the ranking to flows and return it
        return ranking.map(([sector, ranking]) => {
            return {
                id: sector.id,
                name: sector.name,
                ranking,
            };
        });
    }
}

/**
 * Creates the list with the commodities for which the inputs and outputs
 * should be computed.
 */
const CommodityList = (props: {
    config: Config,
    sectors: Sector[],
    widget: Widget,
}) => {

    // collect the selected sectors and their
    // scaling factors from the configuration
    // and store them in a map:
    // sector code -> factor
    const selection: TMap<number> = {};
    if (props.config.sectors) {
        props.config.sectors.reduce((numMap, code) => {
            const parts = code.split(':');
            if (parts.length < 2) {
                numMap[code] = 100;
            } else {
                numMap[parts[0]] = parseInt(parts[1]);
            }
            return numMap;
        }, selection);
    }

    // fire a change in the sector selection
    // based on the current selection state
    const fireSelectionChange = () => {
        const sectors = Object.keys(selection).map(
            code => code
                ? `${code}:${selection[code]}`
                : null)
            .filter(s => s ? true : false);
        props.widget.fireChange({ sectors });
    };

    // map the sectors to commodity objects
    const commodities: Commodity[] = props.sectors.map(s => {
        return {
            id: s.id,
            name: s.name,
            code: s.code,
            selected: selection[s.code] ? true : false,
            value: ifNone(selection[s.code], 100),
        };
    });

    // create the column definitions of the data grid.
    const columns: ColDef[] = [
        {
            // the check box with click handler
            field: "selected",
            width: 50,
            renderCell: (params) => {
                const commodity = params.data as Commodity;
                return <Checkbox
                    checked={commodity.selected}
                    onClick={() => {
                        if (commodity.selected) {
                            delete selection[commodity.code];
                        } else {
                            selection[commodity.code] = 100;
                        }
                        fireSelectionChange();
                    }} />;
            }
        },
        {
            // sector name
            field: "name",
            headerName: "Sector",
            width: 300,
        },
        {
            // the slider for the scaling factor
            field: "value",
            headerName: " ",
            width: 100,
            renderCell: (params) => {
                const commodity = params.data as Commodity;
                return (
                    <Slider
                        value={commodity.value}
                        disabled={!commodity.selected}
                        onChange={(_, value) => {
                            selection[commodity.code] = value as number;
                            fireSelectionChange();
                        }}
                        min={0}
                        max={500}
                        ValueLabelComponent={SliderTooltip} />
                );
            }
        }
    ];

    const onPageChange = (p: PageChangeParams) => {
        props.widget.fireChange({
            page: p.page,
            count: p.pageSize
        });
    };

    return (
        <DataGrid
            columns={columns}
            rows={commodities}
            pageSize={ifNone(props.config.count, 10)}
            page={ifNone(props.config.page, 1)}
            onPageChange={onPageChange}
            onPageSizeChange={onPageChange}
            rowsPerPageOptions={[10, 20, 30, 50, 100]}
            hideFooterSelectedRowCount
            hideFooterRowCount
            headerHeight={0} />
    );
};

/**
 * A custom tooltip for the slider values.
 */
const SliderTooltip = (props: {
    children: React.ReactElement,
    open: boolean,
    value: number,
}) => {
    const { children, open, value } = props;
    return (
        <Tooltip
            open={open}
            enterTouchDelay={0}
            placement="top"
            title={value + "%"}>
            {children}
        </Tooltip>
    );
};

/**
 * Generates the list with input or output flows.
 */
const IOList = (props: {
    config: Config,
    widget: IOGrid,
    direction: "input" | "output"
}) => {

    const flows: IOFlow[] = props.widget.rank(
        props.config, props.direction);

    const columns: ColDef[] = [
        {
            field: "name",
            headerName: "Sector",
            width: 300,
        },
        {
            // the bar
            field: "ranking",
            width: 150,
            renderCell: (params) => {
                const flow = params.data as IOFlow;
                return (
                    <svg height="15" width="50"
                        style={{ float: "left", clear: "both" }}>
                        <rect x="0" y="2.5"
                            height="10" fill="#f50057"
                            width={50 * (0.05 + 0.95 * flow.ranking)} />
                    </svg>
                );
            }
        }
    ];

    return (
        <DataGrid
            columns={columns}
            rows={flows}
            pageSize={props.config.count}
            hideFooterSelectedRowCount
            hideFooterRowCount
            headerHeight={0} />
    );
};
