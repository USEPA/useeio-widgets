import React, { useState } from "react";
import * as ReactDOM from "react-dom";

import { Config } from "../../config";
import { Widget } from "../../widget";
import { Indicator, Model, Sector, Matrix } from "../../webapi";
import { HeatmapResult } from "../../calc/heatmap-result";
import { MatrixCombo } from "../matrix-selector";
import { ones } from "../../calc/calc";
import * as naics from "../../naics";
import * as strings from "../../util/strings";
import * as paging from "../../util/paging";

import { ImpactHeader, ImpactResult, selectIndicators } from "./impacts";
import { DownloadSection } from "./download";
import { ListHeader } from "./list-header";
import { SectorHeader, InputOutputCells } from "./iotable";
import { isNone, isNoneOrEmpty } from "../../util/util";
import { Card, CardContent, Grid, makeStyles, TablePagination, Typography } from "@material-ui/core";
import { PageChangeParams } from "@material-ui/data-grid";

const Currency = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});

export class SectorList extends Widget {

    /**
     * The current configuration of the heatmap.
     */
    config: Config;

    result: HeatmapResult;
    demand: { [code: string]: number };
    indicators: Indicator[];

    /**
     * Contains the (sorted) sectors that should be displayed in this list.
     */
    sectors: Sector[];

    /**
     * The direct requirements matrix A of the underlying input-output model.
     * This matrix is only loaded if sector inputs or outputs should be
     * displayed in this widget.
     */
    matrixA: Matrix;

    _naicsCodes: string[];

    constructor(private model: Model, private selector: string) {
        super();
        const parent = document.querySelector(selector);
        if (parent) {
            const naics = parent.getAttribute("data-naics");
            if (strings.isNotEmpty(naics)) {
                this._naicsCodes = naics.split(",");
            }
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === "data-naics") {
                        const naics = parent.getAttribute("data-naics");
                        this._naicsCodes = naics.split(",");
                        const config: Config = this.config ? { ...this.config } : {};
                        config.naics = this._naicsCodes;
                        this.update(config);
                    }
                });
            });
            observer.observe(parent, {
                attributeFilter: ["data-naics"],
            });
        }
    }

    async update(config: Config) {
        // run a new calculation if necessary
        const needsCalc = this.needsCalculation(this.config, config);
        if (needsCalc) {
            this.result = await calculate(this.model, config);
        }
        this.config = config;

        // select and sort the sectors that should be displayed
        // if a list of NAICS codes is given we filter the sectors
        // with matching codes; the sectors should be in the order
        // of the corresponding NAICS codes then.
        if (this.result) {
            this.sectors = this.result.sectors;
        } else {
            const { sectors } = await this.model.singleRegionSectors();
            this.sectors = sectors;
        }

        this.sectors.sort((s1, s2) => strings.compare(s1.name, s2.name));
        const naicsCodes = this._naicsCodes || config.naics;
        this.sectors = naics.filterByNAICS(naicsCodes, this.sectors);

        // load the matrix A for the display of sector inputs or outputs
        // if this is required
        if (!this.matrixA
            && (strings.isMember("inputs", config.view)
                || strings.isMember("outputs", config.view))
        ) {
            this.matrixA = await this.model.matrix("A");
        }

        // load the demand vector if required
        if (this.matrixA || (config.showvalues && (!this.demand || needsCalc))) {
            const demandID = await this.model.findDemand(config);
            const demand = await this.model.demand(demandID);
            if (demand) {
                const values: { [id: string]: number } = {};
                demand.forEach((e) => (values[e.sector] = e.amount));
                // this aggregates the demand values by sector
                // code for multi-regional models
                this.demand = {};
                for (const sector of await this.model.sectors()) {
                    const val = values[sector.id];
                    if (!val) {
                        continue;
                    }
                    const sum = this.demand[sector.code];
                    this.demand[sector.code] = sum ? sum + val : val;
                }
            }
        }

        this.indicators = await selectIndicators(config, this.model);

        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this.selector),
        );
    }

    private needsCalculation(oldConfig: Config, newConfig: Config) {
        if (!newConfig || !strings.isMember("mosaic", newConfig.view)) return false;

        if (!oldConfig || !this.result) {
            return true;
        }
        // changes in these fields trigger a calculation
        const fields = [
            "view",
            "perspective",
            "analysis",
            "year",
            "location",
            "view",
        ];
        for (const field of fields) {
            if (oldConfig[field] !== newConfig[field]) {
                return true;
            }
        }
        return false;
    }
}

async function calculate(model: Model, config: Config): Promise<HeatmapResult> {
    // for plain matrices => wrap the matrix into a result
    if (!config.analysis) {
        const M = config.perspective === "direct"
            ? await model.matrix("D")
            : await model.matrix("U");
        const indicators = await model.indicators();
        const sectors = await model.sectors();
        return HeatmapResult.from(model, {
            data: M.data,
            totals: ones(indicators.length),
            indicators: indicators.map((i) => i.code),
            sectors: sectors.map((s) => s.id),
        });
    }

    // run a calculation
    const demand = await model.findDemand(config);
    const result = await model.calculate({
        perspective: config.perspective,
        demand: await model.demand(demand),
    });
    return HeatmapResult.from(model, result);
}

const Component = (props: { widget: SectorList }) => {
    const config = props.widget.config;
    const indicators = props.widget.indicators;
    const result = props.widget.result;
    let indicatorsConfig = [];
    // Get an Indicator array from the config
    if (!isNone(config.indicators)) {
        const indicatorsCode = indicators.map(i => i.code);
        indicatorsConfig = config.indicators.filter(i => indicatorsCode.includes(i)).map(indicatorConfig => {
            let result = null;
            indicators.some(
                (indicator: Indicator) => {
                    return indicator.code === indicatorConfig ? ((result = indicator), true) : false;
                });
            return result;
        });
    }
    const [sorter, setSorter] = React.useState<Indicator[]>(indicatorsConfig);
    const [demandSorter, setDemandSorter] = useState(false);
    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);
    let sectors = props.widget.sectors;
    if (searchTerm) {
        sectors = sectors.filter((s) => strings.search(s.name, searchTerm) >= 0);
    }

    // create the sector ranking, if there is a result
    let ranking: [Sector, number][];
    if (!result) {
        ranking = sectors.map((s) => [s, 0]);
    } else {
        const ranks: {
            [code: string]: number;
        } = {};
        let ind: Indicator[];
        if (config.indicators === undefined) {
            // Exlude JOBS and VADD frome default combined sort
            ind = indicators.filter(i => (i.code !== "JOBS" && i.code !== "VADD"));
        }
        result.getRanking(!isNoneOrEmpty(sorter) ? sorter : ind).reduce((r, rank) => {
            const sector = rank[0];
            const value = rank[1];
            r[sector.code] = value;
            return r;
        }, ranks);
        ranking = sectors.map((sector) => {
            const value = ranks[sector.code];
            return [sector, value ? value : 0];
        });

        if (config.showvalues && demandSorter) {
                // Sort by demand
            ranking.sort(([s1], [s2]) => {
                const d1 = props.widget.demand[s1.code];
                const d2 = props.widget.demand[s2.code];
                if (!d1 && !d2)
                    return 0;
                if (!d1 && d2)
                    return 1;
                if (d1 && !d2)
                    return -1;
                else
                    return d2 - d1;
            });
        } else {
            // Sort by rank
            ranking.sort(([_s1, rank1], [_s2, rank2]) => rank2 - rank1);
        }
    }

    // select the page
    const count = config.count ? config.count : -1;
    const page = config.page ? config.page : 1;
    ranking = paging.select(ranking, { count, page });

    const rows: JSX.Element[] = ranking.map(([sector, rank], i) => (
        <Row
            key={sector.code}
            sector={sector}
            sortIndicator={sorter}
            widget={props.widget}
            rank={rank}
            index={i}
            config={config}
        />
    ));
    let marginTop = 0;
    if (config.view && config.view.includes("mosaic") && config.showvalues)
        marginTop = 30;
    if (config.view && config.view.includes("mosaic") && !config.showvalues)
        marginTop = 130;
        

    const onChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
        props.widget.fireChange({
            page: page + 1
        });
    };

    const onChangeRow = (e: any) => {
        const count = e.target.value;
        props.widget.fireChange({
            page: 1,
            count: (count === -1) ? sectors.length : count
        });
    };

    return (
        <div style={{ marginTop: marginTop }}>
            {
                // display the matrix selector if we display a result
                config.selectmatrix && props.widget.result ? (
                    <MatrixCombo config={config} widget={props.widget} />
                ) : (
                        <></>
                    )
            }
            {
                // display download links if this is configured
                config.showdownload ? <DownloadSection widget={props.widget} /> : <></>
            }
            <ListHeader
                config={config}
                sectorCount={sectors.length}
                onConfigChange={(conf) => props.widget.fireChange(conf)}
                onSearch={(term) => setSearchTerm(term)}
            />
            <table className="sector-list-table">
                <thead>
                    <tr className="indicator-row">

                        <th style={{ width: 400 }}></th>
                        {
                            // optional demand column
                            config.showvalues
                                ? (
                                    <th>
                                        <div>
                                            <span onClick={(_) => {
                                                setSorter([]);
                                                setDemandSorter(!demandSorter);
                                            }}><a>Demand [billions]</a></span>
                                        </div>
                                    </th>
                                )
                                : <></>
                        }

                        <ImpactHeader
                            indicators={indicators}
                            onClick={(i) => {
                                const s = [];
                                if (!sorter.includes(i)) {
                                    s.push(i);
                                }
                                setDemandSorter(false);
                                setSorter(s);
                            }}
                            config={config}
                        />

                        {
                            // SectorHeader displays the corresponding sector
                            // names in the table header if sector inputs or
                            // outputs should be displayed
                        }
                        <SectorHeader widget={props.widget} />

                        {
                            // optional column with ranking values
                            strings.isMember("ranking", config.view)
                                ? (
                                    <th>
                                        <div>
                                            <span>Ranking</span>
                                        </div>
                                    </th>
                                )
                                : <></>
                        }
                    </tr>
                </thead>
                <tbody className="sector-list-body">{rows}</tbody>
            </table>
            <TablePagination
                style={{ position: "relative", float: "left" }}
                component="div"
                count={sectors.length}
                page={config.page ? config.page - 1 : 0}
                rowsPerPage={config.count ? config.count : 10}
                rowsPerPageOptions={[{ label: "All", value: sectors.length }, 10, 20, 30, 40, 50, 100]}
                onChangePage={onChangePage}
                onChangeRowsPerPage={(p) => onChangeRow(p)}
            />
            {(config.indicators === undefined || config.showvalues) && (
                <Grid container spacing={5} style={{ marginTop: 50 }}>
            {config.indicators === undefined && (
                <Grid item>
                    <ExclusionOfIndicators />
                 </Grid>
            )}
            {config.showvalues && (
                <Grid item>
                    <DemandExplanation />
                </Grid>
            )}
            </Grid>
            )}
        </div>
    );
};



const DemandExplanation = () => {
  const useStyles = makeStyles({
    root: {
      minWidth: 275,
      maxWidth: 600,
      fontSize: 12,
      marginBottom: 20,
    },
    content: {
      "&:last-child": {
        paddingBottom: 16,
      },
    },
  });
  const classes = useStyles();
  return (
    <Card className={classes.root}>
      <CardContent className={classes.content}>
        <Typography>
          {" "}
          For the demand column, there is 3 types of values:{" "}
        </Typography>
        <ul>
          <li>
            <b>---</b> : Commodities with no demand values. Other commodities
            provide their demand.
          </li>
          <li>
            <b>0.000</b> : Commodities with demand values less than 0.0005
            billion.
          </li>
          <li>
            <b>1.234</b> : Commodities with demand values in billions.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};

const ExclusionOfIndicators = () => {
  const useStyles = makeStyles({
    root: {
      minWidth: 275,
      maxWidth: 500,
      fontSize: 12,
      marginBottom: 20,
    },
    content: {
      "&:last-child": {
        paddingBottom: 16,
      },
    },
  });
  const classes = useStyles();
  return (
    <Card className={classes.root}>
      <CardContent className={classes.content}>
        <Typography>
          The positive indicators JOBS and VADD are excluded from the combined
          sort by default. This allows the most adverse overall impacts to appear first.
        </Typography>
      </CardContent>
    </Card>
  );
};

export type RowProps = {
    sector: Sector;
    sortIndicator: Indicator[];
    widget: SectorList;
    rank?: number;
    index: number;
    config: Config;
};

const Row = (props: RowProps) => {
    const config = props.widget.config;
    const sector = props.sector;

    // determine if the sector is selected
    let selected = false;
    if (config.sectors) {
        // the code of the sector is in the sector list of
        // the widget configuration
        selected = config.sectors.indexOf(sector.code) >= 0;
    }

    // the selection handler of the sector
    const onSelect = () => {
        let codes = config.sectors ? config.sectors.slice(0) : null;
        if (!codes) {
            codes = [sector.code];
        } else {
            // there is a sector configuration
            if (selected) {
                const idx = codes.indexOf(sector.code);
                codes.splice(idx, 1);
            } else {
                codes.push(sector.code);
            }
        }
        props.widget.fireChange({ sectors: codes });
    };

    // display the demand value if showvalues=true
    let demand;
    if (config.showvalues) {
        const demandVal = props.widget.demand[sector.code];
        const demandStr = !demandVal
            ? "---"
            : demandVal < 500_000
                ? "0.000"
                : Currency.format(demandVal / 1_000_000_000);
        demand = (
            <td
                style={{
                    borderTop: "lightgray solid 1px",
                    padding: "5px 0px",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                }}
            >
                {demandStr}
            </td>
        );
    }

    // display the ranking value if view=ranking
    let rank;
    if (strings.isMember("ranking", config.view)) {
        rank = (
            <td
                style={{
                    borderTop: "lightgray solid 1px",
                    padding: "5px 0px",
                    whiteSpace: "nowrap",
                }}
            >
                {props.rank ? props.rank.toFixed(3) : null}
            </td>
        );
    }

    const sectorLabel = `${sector.code} - ${sector.name}`;
    return (
        <tr>
            <td
                key={props.sector.code}
                style={{
                    borderTop: "lightgray solid 1px",
                    padding: "5px 0px",
                    whiteSpace: "nowrap",
                }}
            >
                <div style={{ cursor: "pointer" }}>
                    <input type="checkbox" checked={selected} onChange={onSelect}></input>

                    <a title={sectorLabel} onClick={onSelect}>
                        {strings.cut(sectorLabel, 80)}
                    </a>
                </div>
            </td>
            {config.showvalues ? demand : <></>}
            <ImpactResult {...props} />
            <InputOutputCells sector={props.sector} widget={props.widget} />
            {rank ? rank : <></>}
        </tr>
    );
};
