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
    Sort,
} from "@material-ui/icons";

import { Indicator, Sector } from "../../webapi";
import { Config } from "../../widget";
import { IOGrid } from "./iogrid";
import { ifNone, isNoneOrEmpty, TMap } from "../../util/util";
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
    widget: IOGrid,
}) => {

    const grid = props.widget;
    const config = props.config;

    // collect the selected sectors and their
    // scaling factors from the configuration
    // and store them in a map:
    // sector code -> factor
    const selection: TMap<number> = {};
    if (config.sectors) {
        config.sectors.reduce((numMap, code) => {
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
        grid.fireChange({ sectors });
    };

    // initialize the states
    const [searchTerm, setSearchTerm] = React.useState("");
    const [menuElem, setMenuElem] = React.useState<null | HTMLElement>(null);
    const emptySelection = Object.keys(selection).length === 0;
    const [sortOpts, setSortOpts] = React.useState(SortOptions.create(grid, config));

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
            renderCell: (params) =>
                <NameCell
                    commodity={params.data as Commodity}
                    sortOpts={sortOpts} />,
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
                count: p.pageSize,
            });
            return;
        }

        grid.fireChange({
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
                            widget={grid} />
                    </Menu>
                </div>
            </Grid>
            <Grid item style={{ width: "100%", height: 600 }}>
                <DataGrid
                    columns={columns}
                    rows={commodities}
                    pageSize={ifNone(config.count, 10)}
                    page={ifNone(config.page, 1)}
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
    options: SortOptions,
    indicators: Indicator[],
    widget: IOGrid,
    onChange: (options: SortOptions) => void,
}, _ref) => {

    const items: JSX.Element[] = [];
    const opts = props.options;

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


const NameCell = (props: { commodity: Commodity, sortOpts: SortOptions }) => {
    const { commodity, sortOpts } = props;
    let subTitle: JSX.Element = null;
    if (sortOpts.hasSingleIndicator) {
        const result = sortOpts.indicatorResult(commodity);
        subTitle =
            <Typography color='textSecondary'>
                {IndicatorValue.format(result)} {sortOpts.indicatorUnit}
            </Typography>;
    }
    return (
        <div>
            <Typography>{commodity.name}</Typography>
            {subTitle}
        </div>
    );
};


const CheckBox = (props: { checked: boolean }) =>
    <ListItemIcon>
        {props.checked
            ? <CheckBoxOutlined fontSize="small" color="secondary" />
            : <CheckBoxOutlineBlankOutlined fontSize="small" />}
    </ListItemIcon>;
