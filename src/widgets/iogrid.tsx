import * as React from "react";
import * as ReactDOM from "react-dom";
import { Checkbox, Grid, Slider, Tooltip, Typography } from "@material-ui/core";
import { DataGrid, ColDef, PageChangeParams } from "@material-ui/data-grid";

import { Matrix, Model, Sector } from "../webapi";
import { Config, Widget } from "../widget";
import * as strings from "../util/strings";

type NumMap = { [code: string]: number };

function or<T>(val: T, defaultVal: T): T {
    return !val
        ? defaultVal
        : val;
}

type Commodity = {
    id: string,
    name: string,
    code: string,
    selected: boolean,
    value: number,
};

export class IOGrid extends Widget {

    A: Matrix;
    sectors: Sector[];
    sectorIndex: { [code: string]: number };

    constructor(
        private model: Model,
        private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        if (!this.A) {
            await this.initFields();
        }

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
        this.sectors.sort((s1, s2) => strings.compare(s1.name, s2.name));
    }

    rankIt(config: Config, direction: "input" | "output"): [Sector, number][] {

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
                const data = direction === "input"
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

const CommodityList = (props: {
    config: Config,
    sectors: Sector[],
    widget: Widget,
}) => {

    const selection: NumMap = {};
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
    const fireSelectionChange = () => {
        const sectors = Object.keys(selection).map(
            code => code
                ? `${code}:${selection[code]}`
                : null)
            .filter(s => s ? true : false);
        props.widget.fireChange({ sectors });
    };

    const commodities: Commodity[] = props.sectors.map(s => {
        return {
            id: s.id,
            name: s.name,
            code: s.code,
            selected: selection[s.code] ? true : false,
            value: or(selection[s.code], 100),
        };
    });

    const columns: ColDef[] = [
        {
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
            field: "name",
            headerName: "Sector",
            width: 300,
        },
        {
            field: "value",
            headerName: " ",
            width: 100,
            renderCell: (params) => {
                return (
                    <SliderCell
                        commodity={params.data as Commodity}
                        onChange={(code, value) => {
                            selection[code] = value;
                            fireSelectionChange();
                        }} />
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
            pageSize={or(props.config.count, 10)}
            page={or(props.config.page, 1)}
            onPageChange={onPageChange}
            onPageSizeChange={onPageChange}
            rowsPerPageOptions={[10, 20, 30, 50, 100]}
            hideFooterSelectedRowCount
            hideFooterRowCount
            headerHeight={0} />
    );
};

const SliderCell = (props: {
    commodity: Commodity,
    onChange: (code: string, value: number) => void
}) => {
    const commodity = props.commodity;
    return (
        <Slider
            value={commodity.value}
            disabled={!commodity.selected}
            onChange={(_, value) => {
                props.onChange(commodity.code, value as number);
            }}
            min={0}
            max={500}
            ValueLabelComponent={SliderTooltip} />
    );
};

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

type IOFlow = {
    id: string,
    name: string,
    ranking: number,
};

const IOList = (props: {
    config: Config,
    widget: IOGrid,
    direction: "input" | "output"
}) => {

    const ranking: IOFlow[] = props.widget.rankIt(
        props.config, props.direction)
        .map(([sector, ranking]) => {
            return {
                id: sector.id,
                name: sector.name,
                ranking,
            };
        });

    const columns: ColDef[] = [
        {
            field: "name",
            headerName: "Sector",
            width: 300,
        },
    ];

    return (
        <DataGrid
            columns={columns}
            rows={ranking}
            pageSize={props.config.count}
            hideFooterSelectedRowCount
            hideFooterRowCount
            headerHeight={0} />
    );

};