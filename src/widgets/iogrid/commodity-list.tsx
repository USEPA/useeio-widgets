import {
  Checkbox,
  Grid,
  IconButton,
  ListItemIcon,
  makeStyles,
  Menu,
  MenuItem,
  Slider,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import {
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
  Sort
} from "@material-ui/icons";
import { DataGrid, GridCellParams, GridColDef } from '@mui/x-data-grid';
import React, { CSSProperties, useEffect } from "react";
import { Config } from "../../";
import { formatNumber, ifNone, isNoneOrEmpty, TMap } from "../../util";
import * as strings from "../../util/strings";
import { Indicator, Sector } from "../../webapi";
import { Commodity, SortOptions } from "./commodity-model";
import { IOGrid } from "./iogrid";
import * as selection from "./selection";

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
        if (config.sectors === undefined) {
          config.sectors = [];
          const selectedSectorsNumber = config.count ? config.count : 10;
          let i = 0;
          for (const commodity of commodities) {
            commodity.selected = true;
            selected[commodity.code] = 100;
            config.sectors.push(commodity.code);
            i++;
            if (i >= selectedSectorsNumber) {
              break;
            }
          }
        }

    if (strings.isNotEmpty(searchTerm)) {
        commodities = commodities.filter(
            c => strings.search(c.name, searchTerm) !== -1);
    }

    // create the column definitions of the data grid.
    const columns: GridColDef[] = [
        {
            // the check box with click handler
            field: "selected",
            headerName:"",
            width: 30,
            cellClassName: "commodityCheckbox",
            
            renderCell: (params) => {
                const commodity = params.row as Commodity;
                return <Checkbox id={commodity.id}
                style={{paddingLeft:0}}
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
            flex:1,
            cellClassName: "commodityGridCell",
            renderCell: (params) =>
                <NameCell
                    commodity={params.row as Commodity}
                    sortOpts={sortOpts}
                    grid={grid}
                    selected={selected}
                    fireSelectionChange={fireSelectionChange}
                />,
        },
    ];

    const onPageChange = (page: number,pageSize:number) => {
      if (!page && !pageSize) {
        return;
      }

      // avoid unnecessary change events
      const currentPage = config.page - 1 || 0;
      const currentSize = config.count || 10;
      if (page === currentPage && pageSize === currentSize) {
        return;
      }
      const sectors = selection.toConfig(config, props.sectors, selected);
      if (pageSize !== currentSize) {
        // jump back to page 1 when the page size changes
        const changes: any = {
          page: 1,
          count: pageSize !== -1 ? pageSize : commodities.length,
        };
        if (config.sectors != sectors) {
          changes.sectors = sectors;
        }
        grid.fireChange(changes);
        return;
      }
      const changes = {
        page: page +1,
        count: pageSize !== -1 ? pageSize : commodities.length,
        sectors: sectors,
      };
      if (config.sectors != sectors) {
        changes.sectors = sectors;
      }
      grid.fireChange(changes);
    };

    // makes the selected value of what commodity is clicked to true
    // when its slider is clicked
    const onSliderClicked = (e: GridCellParams) => {
        if (e.field !== "value") {
            return;
        }
        const commodity = e.value as Commodity;
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
                        style={{
                            zIndex: 10002,
                        }}
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
                                // reset the page to 0 if the sorting type changes
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
                    rowHeight={37 + 15* sortOpts.indicators.length}
                    columns={columns}
                    rows={commodities}
                    pageSize={ifNone(config.count, 10)}
                    page={ifNone(config.page, 1)-1} // Page will be at least 0
                    onPageChange={(page) => onPageChange(page,config.count)}
                    onPageSizeChange={(pageSize) =>onPageChange(config.page,pageSize)}
                    hideFooterSelectedRowCount
                    hideFooterRowCount
                    headerHeight={0}
                    onCellClick={(e: any) => onSliderClicked(e)}
                    rowsPerPageOptions={[10, 20, 30, 50, 100]}
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
    commodities: Commodity[],
    fireSelectionChange: any,
    config: Config
}, _ref) => {
    const items: JSX.Element[] = [];
    const opts = props.options;
 // Choose all commodities
        items.push(
            <MenuItem
                key="choose-all-selected"
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

    // Choose visible commodities
    items.push(
        <MenuItem
            key="choose-all-visible-selected"
            onClick={() => {
                props.onChange(opts.swapUnselectAll());
                props.fireSelectionChange({});
            }}>
            <CheckBox checked={opts.isAllUnselected} />
                Unselect All
            </MenuItem>
    );

        // check box to filter only selected commodities
        items.push(
            <MenuItem
                key="filter-selected-only"
                onClick={() => props.onChange(opts.swapSelectedOnly())}>
                <CheckBox checked={opts.isSelectedOnly} />
                Show Selected Only
            </MenuItem>
        );

        // sort by selection
        items.push(
            <MenuItem
                key="sort-selected-first"
                onClick={() => props.onChange(opts.swapSelectedFirst())}>
                <CheckBox checked={opts.isSelectedFirst} />
                Show Selected First
            </MenuItem>
        );

    // alphabetical sorting
    items.push(
        <MenuItem
            key="sort-alphabetically"
            style={{ borderTop: "#e3e0e0 solid 1px" }}
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

// Green color for JOBS and VADD, orange color for other indicators
const getIndicatorColor = (indicator: Indicator) => {
  return indicator.code != "JOBS" && indicator.code != "VADD"
    ? "#ffb347"
    : "#a9c4ac";
};

// Format the result value with the appropriate unit, prefixed with the indicator name
const formatResultLabel = (indicator: Indicator, result: number) => {
  const indicatorName = indicator.name || indicator.simplename;
  let label = indicatorName + ": ";
  let formatedResult = formatNumber(result);
  if (indicator.unit === "$") {
    formatedResult = "$" + formatedResult;
  } else {
    formatedResult += " " + indicator.simpleunit || indicator.unit;
  }
  label += formatedResult;
  if (indicator.code === "VADD") {
    label += " per $1 spent";
  }
  return label;
};

const NameCell = (props: {
  commodity: Commodity;
  sortOpts: SortOptions;
  grid: IOGrid;
  selected: TMap<number>;
  fireSelectionChange: (selected: TMap<number>) => void;
}) => {
  const useStyles = makeStyles({
    firstRow: {
      display: "inline-block",
    },
    container: {
      display: "flex",
    },
    row: {
      display: "flex",
      flexDirection: "row",
    },
    col: {
      display: "flex",
      flexDirection: "column",
    },
    rightItem: {
      marginLeft: "auto",
      marginRight: 10
    },
    share: {
      paddingTop: 7,
      paddingLeft: 5,
    },
    slider: {
      paddingLeft: 15,
    },
    subRow: {
      fontSize: 14,
      marginTop: -4,
    },
  });
  const classes = useStyles();

  const { commodity, sortOpts } = props;
  let subTitles: JSX.Element[] = [];
  if (sortOpts.hasSingleIndicator) {
    const result = sortOpts.indicatorResult(commodity);
    subTitles.push(
      <Typography
        color="textSecondary"
        key={sortOpts.indicators[0].id}
        className={classes.subRow}
      >
        {formatResultLabel(sortOpts.indicators[0], result)}
      </Typography>
    );
  } else {
    subTitles = sortOpts.indicators.map((indicator, idx) => {
      const values = sortOpts.getCommodityValues(indicator, commodity);
      let toolTip = indicator.simpleunit || indicator.unit;
      if (indicator.code === "VADD") {
        toolTip += " " + "per $ spent";
      }
      const containerStyles: CSSProperties = {
        height: 17,
        width: "100%",
        marginTop: 7,
        marginBottom: 7,
        display: "block",
      };
      const firstContainerStyles: CSSProperties = {
        height: 17,
        width: "100%",
        marginBottom: 7,
        marginTop: -4,
        display: "block",
      };

      const fillerStyles: CSSProperties = {
        height: "3px",
        width: `${values.share * 100}%`,
        backgroundColor: getIndicatorColor(indicator),
        marginTop: -4,
      };

      return (
        <div
          style={idx == 0 ? firstContainerStyles : containerStyles}
          key={indicator.id}
          className={classes.row}
        >
          <Tooltip
            enterTouchDelay={0}
            placement="top"
            title={toolTip.length > 32 ? toolTip : ""}
          >
            {
              <Typography color="textSecondary" className={classes.subRow}>
                {formatResultLabel(indicator, values.result)}
              </Typography>
            }
          </Tooltip>
          <div style={fillerStyles}></div>
        </div>
      );
    });
  }

  const share = sortOpts.relativeIndicatorResult(commodity);

  const title: JSX.Element = <title>{share === 1?100:formatNumber(share  *  100)} %</title>;
  const color = "#90a4ae";
  // if (share < 0.333)
  //   color = "#f50057";
  // else if (share > 0.666)
  //   color = "#428e55";
  const items = (
    <div>
      <Grid container direction="row">
        <Grid item xs={6} sm={8} style={{ overflowX: "hidden" }}>
          <Tooltip
            className={classes.col}
            enterTouchDelay={0}
            placement="top"
            title={commodity.name.length > 35 ? commodity.name : ""}
          >
            {<Typography>{commodity.name}</Typography>}
          </Tooltip>
        </Grid>
        <Grid container item xs={6} sm={4} justifyContent="flex-end">
          <Grid item xs={5} sm={7} className={classes.slider}>
            <Slider
              className={`${classes.col} ${classes.rightItem}`}
              value={commodity.value}
              style={{ width: 70 }}
              disabled={!commodity.selected}
              onChange={(_, value) => {
                const s = props.selected;
                s[commodity.code] = value as number;
                props.fireSelectionChange(s);
              }}
              min={0}
              max={500}
              ValueLabelComponent={SliderTooltip}
            />
          </Grid>
          {sortOpts.isByIndicators && (
            <Grid item xs={7} sm={5} className={classes.share}>
              <svg
                className={`${classes.col} ${classes.rightItem}`}
                height="25"
                width="50"
              >
                {title}
                <rect
                  x="0"
                  y="2.5"
                  height="10"
                  fill={color}
                  width={50 * (0.05 + 0.95 * share)}
                />
              </svg>
            </Grid>
          )}
        </Grid>
      </Grid>

      {subTitles.map((subtitle) => subtitle)}
    </div>
  );

  return items;
};


const CheckBox = (props: { checked: boolean }) =>
    <ListItemIcon>
        {props.checked
            ? <CheckBoxOutlined fontSize="small" color="secondary" />
            : <CheckBoxOutlineBlankOutlined fontSize="small" />}
    </ListItemIcon>;
