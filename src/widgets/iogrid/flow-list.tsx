import React, { useEffect, useState } from "react";


import {
    Grid,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    TextField,
    Typography,
} from "@material-ui/core";
import { ColDef, DataGrid, PageChangeParams } from "@material-ui/data-grid";
import { RadioButtonChecked, RadioButtonUnchecked, Sort } from "@material-ui/icons";

import { Config } from "../..";
import { IOFlow, IOGrid } from "./iogrid";
import * as strings from "../../util/strings";
import { ifNone } from "../../util";


const Currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});


type SortBy = "alphabetical" | "contribution";

/**
 * Generates the list with input or output flows.
 */
export const FlowList = (props: {
    config: Config,
    widget: IOGrid,
    direction: "input" | "output",
}) => {
    // initialize states
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [menuElem, setMenuElem] = useState<null | HTMLElement>(null);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(ifNone(props.config.count, 10));
    const [sortBy, setSortBy] = useState<SortBy>("contribution");

    // Update the pagination settings on config count changes
    useEffect(() => {
        if (props.config.count !== undefined && props.config.count != pageSize) {
            setPageSize(props.config.count);
            setPage(1);
        }
    }, [props.config.count]);

    // prepare the flow list
    let flows: IOFlow[] = props.widget.rank(
        props.config, props.direction);
    if (strings.isNotEmpty(searchTerm)) {
        flows = flows.filter(
            f => strings.search(f.name, searchTerm) !== -1);
    }
    if (sortBy === "alphabetical") {
        flows.sort((f1, f2) => strings.compare(f1.name, f2.name));
    }

    const columns: ColDef[] = [
        {
            field: "name",
            headerName: "Sector",
            width: 300,
            renderCell: (params) => {
                const name = params.data.name;
                const flow = params.data as IOFlow;
                const title = Currency.format(flow.value)
                    + " " + props.direction
                    + " per " + Currency.format(1).split('.')[0];
                return (
                    <div>
                        <Typography>{name}</Typography>
                        <Typography color="textSecondary">{title}</Typography>
                    </div>
                );
            },
        },
        {
            // the bar
            field: "ranking",
            width: 150,
            renderCell: (params) => {
                const flow = params.data as IOFlow;
                const title = Currency.format(flow.value)
                    + " " + props.direction
                    + " per " + Currency.format(1).split('.')[0];
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

    const onPageChange = (p: PageChangeParams) => {
        if (!p) {
            return;
        }

        if (p.page === page) {
            return;
        }

        setPage(p.page);
    };

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
                    <IconButton
                        aria-label="Sort by..."
                        aria-controls={`${props.direction}-flow-list`}
                        aria-haspopup="true"
                        onClick={e => setMenuElem(e.currentTarget)}>
                        <Sort />
                    </IconButton>
                    <Menu
                        id={`${props.direction}-flow-list`}
                        anchorEl={menuElem}
                        keepMounted
                        open={menuElem ? true : false}
                        onClose={() => setMenuElem(null)}>
                        <MenuItem
                            onClick={() => {
                                setMenuElem(null);
                                setSortBy("alphabetical");
                            }}>
                            <ListItemIcon>
                                {sortBy === "alphabetical"
                                    ? <RadioButtonChecked
                                        fontSize="small"
                                        color="secondary" />
                                    : <RadioButtonUnchecked
                                        fontSize="small"
                                        color="secondary" />}
                            </ListItemIcon>
                            Alphabetical
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setMenuElem(null);
                                setSortBy("contribution");
                            }}>
                            <ListItemIcon>
                                {sortBy === "contribution"
                                    ? <RadioButtonChecked
                                        fontSize="small"
                                        color="secondary" />
                                    : <RadioButtonUnchecked
                                        fontSize="small"
                                        color="secondary" />}
                            </ListItemIcon>
                            By Impact
                        </MenuItem>
                    </Menu>
                </div>
            </Grid>
            <Grid item style={{ width: "100%", height: 600 }}>
                <DataGrid
                    columns={columns}
                    rows={flows}
                    pageSize={pageSize}
                    page={page}
                    hideFooterSelectedRowCount
                    hideFooterRowCount
                    headerHeight={0}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[]}
                />
            </Grid>
        </Grid>
    );
};
