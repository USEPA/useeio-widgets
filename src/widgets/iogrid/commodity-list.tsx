import React, { useEffect } from "react";

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
    Sort,
} from "@material-ui/icons";

import { Indicator, Sector } from "../../webapi";
import { Config } from "../../";
import { IOGrid } from "./iogrid";
import { ifNone, isNone, isNoneOrEmpty, TMap } from "../../util";
import * as strings from "../../util/strings";
import * as selection from "./selection";

import { Commodity, SortOptions } from "./commodity-model";
import { CSSProperties } from "@material-ui/styles";

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
    widget: IOGrid,
}) => {

    const grid = props.widget;
    const config = props.config;
    // collect the selected sectors and their scaling factors from the
    // configuration and store them in a map: sector code -> factor
    const selected = selection.fromConfig(config, props.sectors);

    // fire a change in the sector selection
    // based on the current selection state
    const fireSelectionChange = (selected: TMap<number>) => {
        const sectors = selection.toConfig(config, props.sectors, selected);
        grid.fireChange({ sectors });
    };
    
    // initialize the states
    const [searchTerm, setSearchTerm] = React.useState("");
    const [menuElem, setMenuElem] = React.useState<null | HTMLElement>(null);
    const emptySelection = Object.keys(selected).length === 0;
    const [sortOpts, setSortOpts] = React.useState(SortOptions.create(grid, config));

    // Run when component did mount
    useEffect(() => {
        // push indicator updates of the configuration
        if (strings.areListsNotEqual(config.indicators, sortOpts.indicatorCodes)) {
            if (isNoneOrEmpty(config.indicators)) {
                setSortOpts(sortOpts.setAlphabetical());
            } else {
                const indicators = grid.getSortedIndicators()
                    .filter(i => config.indicators.indexOf(i.code) >= 0);
                setSortOpts(sortOpts.setIndicators(indicators));
            }
        }
    }, [config.indicators]);

    // map the sectors to commodity objects
    let commodities: Commodity[] = props.sectors.map(s => {
        return {
            id: s.id,
            index: s.index,
            name: s.name,
            code: s.code,
            selected: typeof selected[s.code] === "number",
            value: ifNone(selected[s.code], 100),
            description: s.description,
        };
    });

    commodities = sortOpts.apply(commodities);

    // If no sectors are selected initially, we select the top 10 by default
    if (isNone(config.sectors)) {
        const DEFAULT_SELECTED_SECTORS_NUMBER = 10;
        let i = 0;
        for (const commodity of commodities) {
            commodity.selected = true;
            selected[commodity.code] = 100;
            i++;
            if (i >= DEFAULT_SELECTED_SECTORS_NUMBER) {
                break;
            }
        }
        fireSelectionChange(selected);
    }

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
                            delete selected[commodity.code];
                        } else {
                            selected[commodity.code] = 100;
                        }
                        fireSelectionChange(selected);
                    }} />;
            }
        },
        {
            // sector name
            field: "name",
            headerName: "Sector",
            width: 300,
            cellClassName: "commodityGridCell",
            renderCell: (params) =>
                <NameCell
                    commodity={params.data as Commodity}
                    sortOpts={sortOpts}
                    grid={grid}
                />,
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
                            selected[commodity.code] = value as number;
                            fireSelectionChange(selected);
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
    if (sortOpts.isByIndicators) {
        columns.push({
            field: "code",
            width: 150,
            renderCell: (params) => {
                const c = params.data as Commodity;
                const result = sortOpts.indicatorResult(c);
                const share = sortOpts.relativeIndicatorResult(c);

                let title: JSX.Element = null;
                if (sortOpts.hasSingleIndicator) {
                    title = <title>
                        {IndicatorValue.format(result)} {
                            sortOpts.indicatorUnit
                        } per $1.000
                        </title>;
                }

                return (
                    <svg height="25" width="25">
                        {title}
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
        const currentPage = config.page || 1;
        const currentSize = config.count || 10;
        if (p.page === currentPage
            && p.pageSize === currentSize) {
            return;
        }

        if (p.pageSize !== currentSize) {
            // jump back to page 1 when the page size changes
            grid.fireChange({
                page: 1,
                count: (p.pageSize !== -1) ? p.pageSize : commodities.length,
            });
            return;
        }

        grid.fireChange({
            page: p.page,
            count: (p.pageSize !== -1) ? p.pageSize : commodities.length
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
        selected[commodity.code] = commodity.value as number;
        fireSelectionChange(selected);
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
                            options={sortOpts}
                            onChange={nextOpts => {
                                const nextCodes = nextOpts.indicatorCodes;
                                const indicatorChange = strings.areListsNotEqual(
                                    nextCodes, sortOpts.indicatorCodes);
                                // close the menu
                                setMenuElem(null);
                                setSortOpts(nextOpts);
                                // reset the page to 1 if the sorting type changes
                                if ((config.page && config.page > 1)
                                    || indicatorChange) {
                                    grid.fireChange({
                                        page: 1,
                                        indicators: nextCodes,
                                    });
                                }
                            }}
                            indicators={grid.getSortedIndicators()}
                            widget={grid}
                            commodities={commodities}
                            fireSelectionChange={fireSelectionChange}
                            config={config}
                        />
                    </Menu>
                </div>
            </Grid>
            <Grid item style={{ width: "100%", height: 600 }}>
                <DataGrid
                    rowHeight={25 + 27 * clamp(sortOpts.indicators.length, 0, 4)}
                    columns={columns}
                    rows={commodities}
                    pageSize={ifNone(config.count, 10)}
                    page={ifNone(config.page, 1)}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageChange}
                    hideFooterSelectedRowCount
                    hideFooterRowCount
                    headerHeight={0}
                    onCellClick={e => onSliderClicked(e)}
                    rowsPerPageOptions={[10, 20, 30, 50, 100]}
                />
            </Grid>
        </Grid>
    );
};

const clamp = (n: number, min: number, max: number) => {
    return Math.min(Math.max(n, min), max);
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
    options: SortOptions,
    indicators: Indicator[],
    widget: IOGrid,
    onChange: (options: SortOptions) => void,
    commodities: Commodity[],
    fireSelectionChange: any,
    config: Config
}, _ref) => {
    const items: JSX.Element[] = [];
    const opts = props.options;
 // Choose all commodities
        items.push(
            <MenuItem
                key="sort-all-selected"
                onClick={() => {
                    const selected: TMap<number> = {};
                    if (!opts.isAllSelected) {
                        props.commodities.forEach(c => {
                            c.selected = true;
                            selected[c.code] = ifNone(c.value, 100);
                        });
                    } else {
                        props.commodities.forEach(c => {
                            c.selected = false;
                        });
                    }
                    props.onChange(opts.swapSelectAll());
                    props.fireSelectionChange(selected);
                }}>
                <CheckBox checked={opts.isAllSelected} />
                Choose All Commodities
            </MenuItem>
        );
    // Choose all commodities
    items.push(
         <MenuItem
            key="sort-all-visible-selected"
            onClick={() => {
                const selected: TMap<number> = {};
                if (!opts.isAllVisibleSelected) {
                    const page = ifNone(props.config.page, 1);
                    const pageSize = ifNone(props.config.count, 10);
                    const start = pageSize * (page - 1);
                    const end = pageSize * page;
                    for (let index = start; index < end; index++) {
                        const c = props.commodities[index];
                        c.selected = true;
                        selected[c.code] = ifNone(c.value, 100);
                    }
                } else {
                    props.commodities.forEach(c => {
                        c.selected = false;
                    });
                }

                props.onChange(opts.swapSelectAllVisible());
                props.fireSelectionChange(selected);
            }}>
            <CheckBox checked={opts.isAllVisibleSelected} />
            Choose All Visible
        </MenuItem>
    );
    if (props.withSelection) {
        // check box to filter only selected commodities
        items.push(
            <MenuItem
                key="filter-selected-only"
                onClick={() => props.onChange(opts.swapSelectedOnly())}>
                <CheckBox checked={opts.isSelectedOnly} />
                Selected Only
            </MenuItem>
        );

        // sort by selection
        items.push(
            <MenuItem
                key="sort-selected-first"
                onClick={() => props.onChange(opts.swapSelectedFirst())}>
                <CheckBox checked={opts.isSelectedFirst} />
                Selected First
            </MenuItem>
        );
    }

    // alphabetical sorting
    items.push(
        <MenuItem
            key="sort-alphabetically"
            onClick={() => {
                if (!opts.isAlphabetical) {
                    props.onChange(opts.setAlphabetical());
                }
            }}>
            <CheckBox checked={opts.isAlphabetical} />
            Alphabetical
        </MenuItem>
    );


    // sort items for the indicators
    for (const indicator of props.indicators) {
        const selected = opts.isSelected(indicator);
        items.push(
            <MenuItem
                key={`sort-by-${indicator.code}`}
                onClick={() => {
                    props.onChange(opts.swapSelectionOf(indicator));
                }}>
                <CheckBox checked={selected} />
                By {indicator.simplename || indicator.name}
            </MenuItem>
        );
    }

    return <>{items}</>;
});


const NameCell = (props: { commodity: Commodity, sortOpts: SortOptions, grid: IOGrid }) => {
    const { commodity, sortOpts } = props;
    let subTitles: JSX.Element[] = [];
    if (sortOpts.hasSingleIndicator) {
        const result = sortOpts.indicatorResult(commodity);
        subTitles.push(
            <Typography color='textSecondary'>
                {IndicatorValue.format(result)} {sortOpts.indicatorUnit}
            </Typography>);
    } else {
        subTitles = sortOpts.indicators.slice(0, 4).map(indicator => {
            const values = sortOpts.getCommodityValues(indicator, commodity);
            const toolTip = indicator.simpleunit || indicator.unit;
            const containerStyles: CSSProperties = {
                height: 20,
                width: '100%',
                margin: 7,
                display: 'block'
            };

            const fillerStyles: CSSProperties = {
                height: '100%',
                width: `${values.share * 100}%`,
                backgroundColor: '#e0e0de',
                textAlign: 'left',
                paddingBottom: '22px'
            };

            return (
                <div style={containerStyles}>
                    <div style={fillerStyles}>
                    <Tooltip
                    enterTouchDelay={0}
                    placement="top"
                    title={toolTip.length > 32 ? toolTip : ""}>
                            {<Typography color='textSecondary'>
                                {IndicatorValue.format(values.result)} {toolTip}
                    </Typography>}
                </Tooltip>
                    </div>
                </div>


            );
        });
    }

    const items = <div>
        <Tooltip
            enterTouchDelay={0}
            placement="top"
            title={commodity.name.length > 35 ? commodity.name : ""}
        >
            {<Typography>{commodity.name}</Typography>}
        </Tooltip>
        <div>
            {subTitles.map(subtitle => (
                subtitle
            ))}
        </div>
    </div>;

    return items;
    };


const CheckBox = (props: { checked: boolean }) =>
    <ListItemIcon>
        {props.checked
            ? <CheckBoxOutlined fontSize="small" color="secondary" />
            : <CheckBoxOutlineBlankOutlined fontSize="small" />}
    </ListItemIcon>;
