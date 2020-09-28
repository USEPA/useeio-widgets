import * as React from "react";
import * as ReactDOM from "react-dom";
import { Slider, Tooltip } from "@material-ui/core";
import { DataGrid, ColDef } from "@material-ui/data-grid";

import { Model } from "../webapi";
import { Config, Widget } from "../widget";

export class IOGrid extends Widget {

    constructor(
        private model: Model,
        private selector: string) {
        super();
        this.ready();
    }

    protected async handleUpdate(_config: Config) {

        const sectors = await this.model.sectors();
        // const rows: RowsProp[] = (await this.model.sectors()).map(s => { 
        //     return { 
        //         id: s.id, selected: true, sector: s } });
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

        ReactDOM.render(
            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    columns={columns}
                    rows={sectors}
                    pageSize={10}
                    checkboxSelection
                    onSelectionChange={e => console.log(e.rows)} />
            </div>,
            document.querySelector(this.selector)
        );

    }

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