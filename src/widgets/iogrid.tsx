import * as React from "react";
import * as ReactDOM from "react-dom";
import { Slider, Tooltip } from "@material-ui/core";
import { DataGrid, ColDef, PageChangeParams } from "@material-ui/data-grid";

import { Model, Sector } from "../webapi";
import { Config, Widget } from "../widget";
import * as strings from "../util/strings";

type NumMap = { [code: string]: number }

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
}

export class IOGrid extends Widget {

    constructor(
        private model: Model,
        private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(config: Config) {
        const sectors = (await this.model.singleRegionSectors()).sectors;
        sectors.sort((s1, s2) => strings.compare(s1.name, s2.name));
        ReactDOM.render(
            <div style={{ height: 500, width: 450 }}>
                <CommodityList
                    config={config}
                    sectors={sectors}
                    widget={this} />
            </div>,
            document.querySelector(this.selector)
        );
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
                numMap[code] = 100
            } else {
                numMap[parts[0]] = parseInt(parts[1])
            }
            return numMap
        }, selection);
    }
    const fireSelectionChange = () => {
        const sectors = Object.keys(selection).map(
            code => `${code}:${selection[code]}`);
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
                            selection[code] = value
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
            onPageSizeChange={onPageChange} />
    );
}

const SliderCell = (props: {
    commodity: Commodity,
    onChange: (code: string, value: number) => void
}) => {
    const commodity = props.commodity;
    return (
        <Slider
            value={commodity.value}
            onChange={(_, value) => {
                props.onChange(commodity.code, value as number);
            }}
            min={0}
            max={500}
            ValueLabelComponent={SliderTooltip} />
    );
}

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
}