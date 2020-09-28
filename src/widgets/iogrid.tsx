import * as React from "react";
import * as ReactDOM from "react-dom";
import { Slider, Tooltip } from "@material-ui/core";
import { DataGrid, ColDef } from "@material-ui/data-grid";

import { Model, Sector } from "../webapi";
import { Config, Widget } from "../widget";
import * as strings from "../util/strings";

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
            <div style={{ height: 500, width: '100%' }}>
                <CommodityList config={config} sectors={sectors} />
            </div>,
            document.querySelector(this.selector)
        );
    }

}

type NumMap = { [code: string]: number }

const CommodityList = (props: {
    config: Config,
    sectors: Sector[],
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

    const columns: ColDef[] = [
        {
            field: "name",
            headerName: "Sector",
            width: 300,
        },
        {
            field: "code",
            headerName: " ",
            width: 100,
            renderCell: (_params) => {
                return <SliderCell />
            }
        }
    ];

    return (
        <DataGrid
            columns={columns}
            rows={props.sectors}
            pageSize={10}
            checkboxSelection
            onSelectionChange={e => console.log(e.rows)} />
    );
}

const SliderCell = () => {
    const [value, setValue] = React.useState(100);
    return (
        <Slider
            value={value}
            onChange={(_, v) => setValue(v as number)}
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