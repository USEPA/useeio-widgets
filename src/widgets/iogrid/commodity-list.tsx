import * as React from "react";

import { CellParams, ColDef, DataGrid, PageChangeParams } from "@material-ui/data-grid";
import {
    Checkbox,
    Grid,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Slider,
    TextField,
    Tooltip,
    Typography,
} from "@material-ui/core";

import {
    CheckBoxOutlineBlankOutlined,
    CheckBoxOutlined,
    RadioButtonChecked,
    RadioButtonUnchecked,
    Sort,
} from "@material-ui/icons";

import { Indicator, Sector } from "../../webapi";
import { Config } from "../../widget";
import { IOGrid } from "./iogrid";
import { ifNone, isNotNone, TMap } from "../../util/util";
import * as strings from "../../util/strings";

import { Commodity, SortOptions } from "./commodity-model";


const IndicatorValue = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});

/**
 * Creates the list with the commodities for which the inputs and outputs
 * should be computed.
 */
export const CommodityList = (props: {
    sectors: Sector[],
    config: Config,
    indicators: Indicator[],
    widget: IOGrid,
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

    // initialize the states
    const [searchTerm, setSearchTerm] = React.useState("");
    const [menuElem, setMenuElem] = React.useState<null | HTMLElement>(null);
    const emptySelection = Object.keys(selection).length === 0;

    const [sortOpts, setSortOpts] = React.useState(new SortOptions());

    // map the sectors to commodity objects
    let commodities: Commodity[] = props.sectors.map(s => {
        return {
            id: s.id,
            index: s.index,
            name: s.name,
            code: s.code,
            selected: typeof selection[s.code] === "number",
            value: ifNone(selection[s.code], 100),
            description: s.description,
        };
    });
    commodities = sortOpts.apply(commodities);

    if (strings.isNotEmpty(searchTerm)) {
        commodities = commodities.filter(
            c => strings.search(c.name, searchTerm) !== -1);
    }

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
                    title={commodity.description}
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
            renderCell: (params) => {
                const commodity = params.data as Commodity;
                let subTitle: JSX.Element = null;
                if (sortOpts.isByIndicator) {
                    const result = sortOpts.indicatorResult(commodity);
                    subTitle = <Typography color='textSecondary'>
                        {IndicatorValue.format(result)} {sortOpts.indicatorUnit}
                    </Typography>;
                }
                return (
                    <div>
                        <Typography>{commodity.name}</Typography>
                        {subTitle}
                    </div>
                );
            }
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

    // add a result indicator when the list is sorted
    // by indicator results
    if (sortOpts.isByIndicator) {
        columns.push({
            field: "code",
            width: 150,
            renderCell: (params) => {
                const commodity = params.data as Commodity;
                const result = sortOpts.indicatorResult(commodity);
                const share = maxIndicatorResult
                    ? result / maxIndicatorResult
                    : 0;
                return (
                    <svg height="25" width="25">
                        <title>
                            {IndicatorValue.format(result)} {
                                indicator.simpleunit || indicator.unit
                            } per $1.000
                        </title>
                        <rect x="0" y="2.5"
                            height="10" fill="#f50057"
                            width={50 * (0.05 + 0.95 * share)} />
                    </svg>
                );
            },
        });
    }

    const onPageChange = (p: PageChangeParams) => {
        if (!p) {
            return;
        }

        // avoid unnecessary change events
        const currentPage = props.config.page || 1;
        const currentSize = props.config.count || 10;
        if (p.page === currentPage
            && p.pageSize === currentSize) {
            return;
        }

        if (p.pageSize !== currentSize) {
            // jump back to page 1 when the page size changes
            props.widget.fireChange({
                page: 1,
                count: p.pageSize,
            });
            return;
        }

        props.widget.fireChange({
            page: p.page,
            count: p.pageSize
        });
    };

    // makes the selected value of what commodity is clicked to true
    // when its slider is clicked
    const onSliderClicked = (e: CellParams) => {
        if (e.field !== "value") {
            return;
        }
        const commodity = e.data as Commodity;
        if (commodity.selected) {
            return;
        }
        commodity.selected = true;
        selection[commodity.code] = commodity.value as number;
        fireSelectionChange();
    };

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <Typography variant="h6" component="span">
                    Commodities
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
                        aria-controls="commodity-sort-menu"
                        aria-haspopup="true"
                        onClick={e => setMenuElem(e.currentTarget)}>
                        <Sort />
                    </IconButton>
                    <Menu
                        id="commodity-sort-menu"
                        anchorEl={menuElem}
                        keepMounted
                        open={menuElem ? true : false}
                        onClose={() => setMenuElem(null)}
                        PaperProps={{
                            style: {
                                maxHeight: "85vh",
                            },
                        }}>
                        <SortMenu
                            withSelection={!emptySelection}
                            selectedOnly={selectedOnly}
                            currentSorter={indicator ? indicator : sortBy}
                            indicators={
                                filterIndicators(props.indicators, props.config)
                            }
                            widget={props.widget}
                            config={props.config}
                            setIndicator={setIndicator}
                            setMenuElem={setMenuElem}
                            setSortBy={setSortBy}
                            setSelectedOnly={setSelectedOnly} />
                    </Menu>
                </div>
            </Grid>
            <Grid item style={{ width: "100%", height: 600 }}>
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
                    headerHeight={0}
                    onCellClick={e => onSliderClicked(e)}
                />
            </Grid>
        </Grid>
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

const SortMenu = React.forwardRef((props: {
    withSelection: boolean,
    selectedOnly: boolean,

    currentSorter: SortBy | Indicator,
    indicators: Indicator[],
    widget: IOGrid,
    config: Config,
    setMenuElem: (elem: null | HTMLElement) => void,
    setSortBy: (sorter: SortBy) => void,
    setIndicator: (indicator: Indicator) => void,
    setSelectedOnly: (selectedOnly: boolean) => void,
}, _ref) => {

    const items: JSX.Element[] = [];

    const icon = (sorter: SortBy | Indicator) => {
        const i = sorter === props.currentSorter
            ? <RadioButtonChecked fontSize="small" color="secondary" />
            : <RadioButtonUnchecked fontSize="small" />;
        return <ListItemIcon>{i}</ListItemIcon>;
    };

    const onSortBy = (nextSorter: SortBy, indicator?: Indicator) => {
        props.setMenuElem(null); // close the menu
        if (!indicator && nextSorter === props.currentSorter) {
            return;
        }
        props.setSortBy(nextSorter);
        props.setIndicator(indicator ? indicator : null);
        // reset the page to 1 if the sorting type changes
        if (props.config.page && props.config.page > 1) {
            props.widget.fireChange({ page: 1 });
        }
    };

    if (props.withSelection) {

        // check box to filter only selected commodities
        items.push(
            <MenuItem
                key="filter-selected-only"
                onClick={() => props.setSelectedOnly(!props.selectedOnly)}>
                <ListItemIcon>
                    {props.selectedOnly
                        ? <CheckBoxOutlined fontSize="small" color="secondary" />
                        : <CheckBoxOutlineBlankOutlined fontSize="small" />}
                </ListItemIcon>
                Selected Only
            </MenuItem>
        );

        // sort by selection
        items.push(
            <MenuItem
                key="sort-by-selection"
                onClick={() => onSortBy("selection")}>
                {icon("selection")}
                Selected First
            </MenuItem>
        );
    }

    // alphabetical sorting
    items.push(
        <MenuItem
            key="sort-alphabetically"
            onClick={() => onSortBy("alphabetical")}>
            {icon("alphabetical")}
            Alphabetical
        </MenuItem>
    );

    // sort items for the indicators
    for (const indicator of props.indicators) {
        items.push(
            <MenuItem
                key={`sort-by-${indicator.code}`}
                onClick={() => onSortBy("indicator", indicator)}>
                {icon(indicator)}
                By {indicator.simplename || indicator.name}
            </MenuItem>
        );
    }

    return <>{items}</>;
});

const sortCommodities = (commodities: Commodity[], config: {
    by: SortBy,
    values?: number[]
}) => {
    return commodities.sort((c1, c2) => {

        // selected items first
        if (config.by === "selection" && c1.selected !== c2.selected) {
            return c1.selected ? -1 : 1;
        }

        // larger indicator contributions first
        if (config.by === "indicator" && config.values) {
            const val1 = config.values[c1.index];
            const val2 = config.values[c2.index];
            if (val1 !== val2) {
                return val2 - val1;
            }
        }

        // sort alphabetically by default
        return strings.compare(c1.name, c2.name);
    });
};

/**
 * Sort the indicators for the `sort-by` menu. We also filter the indicators
 * when a possible indicator filter is set in the configuration here.
 */
const filterIndicators = (indicators: Indicator[], config: Config): Indicator[] => {
    if (!indicators) {
        return [];
    }
    const codes = config?.indicators;
    const filtered = !codes
        ? indicators.slice(0)
        : indicators.filter(i => strings.eq(i.code, ...codes));
    if (!filtered) {
        return [];
    }

    // it was specified, that these indicators should be always
    // at the top of the list ...
    const predef: TMap<number> = {
        "Jobs Supported": 1,
        "Value Added": 2,
        "Energy Use": 3,
        "Land Use": 4,
        "Water Use": 5,
    };

    return filtered.sort((i1, i2) => {
        const name1 = i1.simplename || i1.name;
        const name2 = i2.simplename || i2.name;
        const c1 = predef[name1];
        const c2 = predef[name2];
        if (isNotNone(c1) && isNotNone(c2)) {
            return c1 - c2;
        }
        if (isNotNone(c1)) {
            return -1;
        }
        if (isNotNone(c2)) {
            return 1;
        }
        return strings.compare(name1, name2);
    });
};