import * as React from "react";
import * as ReactDOM from "react-dom";

import { Widget, Config } from "../../widget";
import { Indicator, Model, Sector, Matrix } from "../../webapi";
import { HeatmapResult } from "../../calc/heatmap-result";
import { MatrixCombo } from "../matrix-selector";
import { ones } from "../../calc/calc";
import * as naics from "../../naics";
import * as strings from "../../util/strings";

import { ImpactHeader, ImpactResult, selectIndicators } from "./impacts";
import { DownloadSection } from "./download";
import { Paginator } from "./paginator";
import { SectorHeader, InputOutputCells } from "./iotable";

export class IndustryList extends Widget {

    /**
     * The current configuration of the heatmap.
     */
    config: Config;

    result: HeatmapResult;
    demand: { [code: string]: number };
    indicators: Indicator[];

    /**
     * The industry sectors of the model. This array is only initialized and
     * thus should be only used when this heatmap has no results.
     */
    sectors: Sector[];

    private _naicsAttr: string;

    /**
     * The direct requirements matrix A of the underlying input-output model.
     * This matrix is only loaded if sector inputs or outputs should be
     * displayed in this widget.
     */
    matrixA: Matrix;

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
        const parent = document.querySelector(selector);
        if (parent) {
            this._naicsAttr = parent.getAttribute("data-naics");
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === "data-naics") {
                        const naicsAttr = parent.getAttribute("data-naics");
                        const config: Config = this.config
                            ? { ... this.config }
                            : {};
                        config.naics = naicsAttr
                            ? naicsAttr.split(",").map(code => code.trim())
                            : undefined;
                        this.handleUpdate(config);
                    }
                });
            });
            observer.observe(parent, {
                attributeFilter: ["data-naics"],
            });
        }
    }

    protected async handleUpdate(config: Config) {

        // run a new calculation if necessary
        const needsCalc = this.needsCalculation(this.config, config);

        this.config = { ...config };
        if (!this.config.naics && this._naicsAttr) {
            this.config.naics = this._naicsAttr
                .split(",")
                .map(code => code.trim());
        }

        if (needsCalc) {
            this.result = await calculate(this.model, config);
        }
        if (!this.result) {
            // initialize the sector array
            const { sectors } = await this.model.singleRegionSectors();
            this.sectors = sectors;
        }

        // load the demand vector if required
        if (config.showvalues && (!this.demand || needsCalc)) {
            const demandID = await this.model.findDemand(config);
            const demand = await this.model.demand(demandID);
            if (demand) {
                const values: { [id: string]: number } = {};
                demand.forEach(e => values[e.sector] = e.amount);
                // this aggregates the demand values by sector
                // code for multi-regional models
                this.demand = {};
                for (const sector of (await this.model.sectors())) {
                    const val = values[sector.id];
                    if (!val) {
                        continue;
                    }
                    const sum = this.demand[sector.code];
                    this.demand[sector.code] = sum
                        ? sum + val
                        : val;
                }
            }
        }

        // load the matrix A for the display of sector inputs or outputs
        // if this is required
        if (!this.matrixA &&
            (strings.isMember("inputs", config.view)
                || strings.isMember("outputs", config.view))) {
            this.matrixA = await this.model.matrix("A");
        }

        this.indicators = await selectIndicators(config, this.model);

        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this.selector));
    }

    private needsCalculation(oldConfig: Config, newConfig: Config) {
        if (!newConfig || !strings.isMember("mosaic", newConfig.view))
            return false;

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
            "view"
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
            indicators: indicators.map(i => i.code),
            sectors: sectors.map(s => s.id),
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

const Component = (props: { widget: IndustryList }) => {

    const config = props.widget.config;
    const [sorter, setSorter] = React.useState<Indicator | null>(null);
    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);

    const indicators = props.widget.indicators;
    const result = props.widget.result;

    // create the sector ranking
    let ranking: [Sector, number][] = result
        ? result.getRanking(sorter ? [sorter] : indicators)
        : props.widget.sectors.map(s => [s, 0]);
    if (searchTerm) {
        ranking = ranking.filter(
            ([s,]) => strings.search(s.name, searchTerm) >= 0);
    }
    ranking.sort(([s1, rank1], [s2, rank2]) =>
        rank1 === rank2
            ? strings.compare(s1.name, s2.name)
            : rank2 - rank1);

    // select the page
    const count = config.count;
    if (count && count >= 0) {
        const page = config.page;
        if (page <= 1) {
            ranking = ranking.slice(0, count);
        } else {
            const offset = (page - 1) * count;
            ranking = offset < ranking.length
                ? ranking.slice(offset, offset + count)
                : ranking.slice(0, count);
        }
    }

    const rows: JSX.Element[] = ranking.map(([sector, rank]) =>
        <Row key={sector.code}
            sector={sector}
            sortIndicator={sorter}
            widget={props.widget}
            rank={rank} />
    );

    return (
        <>
            {
                // display the matrix selector if we display a result
                config.selectmatrix && props.widget.result
                    ? <MatrixCombo config={config} widget={props.widget} />
                    : <></>
            }
            {
                // display download links if this is configured
                config.showdownload
                    ? <DownloadSection widget={props.widget} />
                    : <></>
            }
            <table style={{
                marginRight: "80px"
            }}>
                <thead>
                    <tr className="indicator-row">
                        <Header
                            widget={props.widget}
                            count={ranking.length}
                            onSearch={term => setSearchTerm(term)} />

                        { // optional demand column
                            config.showvalues
                                ? <th><div><span>Demand</span></div></th>
                                : <></>
                        }

                        <ImpactHeader
                            indicators={indicators}
                            onClick={(i) => setSorter(
                                sorter === i ? null : i
                            )} />

                        {
                            // SectorHeader displays the corresponding sector
                            // names in the table header if sector inputs or
                            // outputs should be displayed
                        }
                        <SectorHeader widget={props.widget} />

                        { // optional column with ranking values
                            strings.isMember("ranking", config.view)
                                ? <th><div><span>Ranking</span></div></th>
                                : <></>
                        }
                    </tr>
                </thead>
                <tbody className="industry-list-body">
                    {rows}
                </tbody>
            </table>
        </>
    );
};

const Header = (props: {
    widget: IndustryList,
    count: number,
    onSearch: (term: string | null) => void,
}) => {

    const total = props.widget.result?.sectors?.length
        || props.widget.sectors?.length;

    const onSearch = (value: string) => {
        if (!value) {
            props.onSearch(null);
            return;
        }
        const term = value.trim().toLowerCase();
        props.onSearch(term.length === 0 ? null : term);
    };

    return (
        <th>
            <div>
                <Paginator total={total} widget={props.widget} />
                <input className="matrix-search" type="search" placeholder="Search"
                    onChange={e => onSearch(e.target.value)}>
                </input>
            </div>
        </th>
    );
};

export type RowProps = {
    sector: Sector,
    sortIndicator: Indicator | null,
    widget: IndustryList,
    rank?: number,
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
    } else if (config.naics) {
        // there is no sector list in the configuration but
        // maybe a matching NAICS code
        for (const code of config.naics) {
            if (naics.toBEA(code) === sector.code) {
                selected = true;
                break;
            }
        }
    }

    // the selection handler of the sector
    const onSelect = () => {
        let codes = config.sectors
            ? config.sectors.slice(0)
            : null;
        if (!codes && !config.naics) {
            codes = [sector.code];
        } else if (codes) {
            // there is a sector configuration
            if (selected) {
                const idx = codes.indexOf(sector.code);
                codes.splice(idx, 1);
            } else {
                codes.push(sector.code);
            }
        } else if (config.naics) {
            // create a sector configuration from NAICS codes
            codes = selected ? [] : [sector.code];
            for (const naicsCode of config.naics) {
                const code = naics.toBEA(naicsCode);
                if (!code) {
                    continue;
                }
                if (selected && code === sector.code) {
                    continue;
                }
                codes.push(code);
            }
        }
        props.widget.fireChange({ sectors: codes });
    };

    // display the demand value if showvalues=true
    let demand;
    if (config.showvalues) {

        // demand value
        const demandVal = props.widget.demand[sector.code];
        demand = <td style={{
            borderTop: "lightgray solid 1px",
            padding: "5px 0px",
            whiteSpace: "nowrap",
        }}>
            {demandVal ? demandVal.toFixed(3) : null}
        </td>;
    }

    // display the ranking value if view=ranking
    let rank;
    if (strings.isMember("ranking", config.view)) {
        rank = <td style={{
            borderTop: "lightgray solid 1px",
            padding: "5px 0px",
            whiteSpace: "nowrap",
        }}>
            {props.rank ? props.rank.toFixed(3) : null}
        </td>;
    }

    const sectorLabel = `${sector.code} - ${sector.name}`;
    return (
        <tr>
            <td key={props.sector.code}
                style={{
                    borderTop: "lightgray solid 1px",
                    padding: "5px 0px",
                    whiteSpace: "nowrap",
                }}>
                <div style={{ cursor: "pointer" }}>
                    <input type="checkbox"
                        checked={selected}
                        onChange={onSelect}>
                    </input>

                    <a title={sectorLabel}
                        onClick={onSelect}>
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
