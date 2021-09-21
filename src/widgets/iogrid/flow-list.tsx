import {
    Grid,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    TextField,
    Typography
} from "@material-ui/core";
import { RadioButtonChecked, RadioButtonUnchecked, Sort } from "@material-ui/icons";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from "react";
import { Config } from "../..";
import { formatNumber, ifNone } from "../../util";
import * as strings from "../../util/strings";
import { IOFlow, IOGrid } from "./iogrid";





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
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(ifNone(props.config.count, 10));
    const [sortBy, setSortBy] = useState<SortBy>("contribution");
    const [flowRows, setFlowRows] = useState<IOFlow[]>([]);

    // Update the pagination settings on config count changes
    useEffect(() => {
        if (props.config.count !== undefined && props.config.count != pageSize) {
            setPageSize(props.config.count);
            setPage(0);
        }
    }, [props.config.count]);

    useEffect(() => {
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
        setFlowRows(flows);
    }, [props.config.sectors]);



    const columns: GridColDef[] = [
        {
            field: "name",
            headerName: "Sector",
            flex: 7 / 10,
            renderCell: (params) => {
                const flow = params.row as IOFlow;
                const name = flow.name;
                const title =
                    Currency.format(flow.value) +
                    " " +
                    props.direction +
                    " per " +
                    Currency.format(1).split(".")[0] +
                    " spent";
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
            align: "right",
            // flex: 2 / 10,
            renderCell: (params) => {
                const flow = params.row as IOFlow;
                let title =
                    flow.share === 1 ? 100 : formatNumber(flow.share * 100);
                title += " %";
                const color = "#90a4ae";
                // if (flow.share < 0.333)
                //     color = "#f50057";
                // else if (flow.share > 0.666)
                //     color = "#428e55";

                return (
                    <svg height="15" width="50"
                        style={{ float: "left", clear: "both" }}>
                        <title>{title}</title>
                        <rect x="0" y="2.5"
                            height="10" fill={color}
                            width={50 * (0.05 + 0.95 * flow.share)} />
                    </svg>
                );
            }
        }
    ];

    const onPageChange = (p: number) => {
        if (p === page) {
            return;
        }

        setPage(p);
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
                        onClick={(e) => setMenuElem(e.currentTarget)}>
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
                    rows={flowRows}
                    pageSize={pageSize}
                    page={page}
                    hideFooterSelectedRowCount
                    hideFooterRowCount
                    headerHeight={0}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[pageSize]}
                />
            </Grid>
        </Grid>
    );
};
