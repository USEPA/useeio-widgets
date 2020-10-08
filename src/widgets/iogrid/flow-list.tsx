import * as React from "react";

import { Config } from "../../widget";
import { IOFlow, IOGrid } from "./iogrid";

import * as strings from "../../util/strings";
import { Grid, IconButton, TextField, Typography } from "@material-ui/core";
import { ColDef, DataGrid } from "@material-ui/data-grid";
import { Sort } from "@material-ui/icons";

const Currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});

/**
 * Generates the list with input or output flows.
 */
export const FlowList = (props: {
    config: Config,
    widget: IOGrid,
    direction: "input" | "output"
}) => {

    const [searchTerm, setSearchTerm] = React.useState<string>("");

    let flows: IOFlow[] = props.widget.rank(
        props.config, props.direction);
    if (strings.isNotEmpty(searchTerm)) {
        flows = flows.filter(
            f => strings.search(f.name, searchTerm) !== -1);
    }

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
                const title = Currency.format(flow.value)
                    + " " + props.direction
                    + " per " + Currency.format(1);
                return (
                    <svg height="15" width="50"
                        style={{ float: "left", clear: "both" }}>
                        <title>{title}</title>
                        <rect x="0" y="2.5"
                            height="10" fill="#f50057"
                            width={50 * (0.05 + 0.95 * flow.share)} />
                    </svg>
                );
            }
        }
    ];

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <Typography variant="h6" component="span">
                    {props.direction == "input"
                        ? "Upstream"
                        : "Downstream"}
                </Typography>
            </Grid>
            <Grid item>
                <div style={{ display: "flex" }}>
                    <TextField
                        placeholder="Search"
                        style={{ width: "100%" }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} />
                    <IconButton>
                        <Sort />
                    </IconButton>
                </div>
            </Grid>
            <Grid item style={{ width: "100%", height: 600 }}>
                <DataGrid
                    columns={columns}
                    rows={flows}
                    pageSize={props.config.count}
                    hideFooterSelectedRowCount
                    hideFooterRowCount
                    headerHeight={0} />
            </Grid>
        </Grid>
    );
};