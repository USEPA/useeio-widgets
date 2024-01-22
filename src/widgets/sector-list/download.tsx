import * as React from "react";

import { SectorList } from "./sector-list";
import { Sector, Indicator } from "useeio";

export const DownloadSection = (props: {
    widget: SectorList,
}) => {

    const onDownload = (format: "CSV" | "JSON") => {

        let text: string;
        const w = props.widget;
        const ranking: [Sector, number][] = w.result
            ? w.result.getRanking(w.indicators)
            : w.sectors.map(s => [s, 0]);

        if (format === "JSON") {

            // create JSON download
            type JsonType = {
                sectors: Sector[],
                indicators?: Indicator[],
                result?: number[][],
                demand?: { [code: string]: number },
            };
            const json: JsonType = {
                sectors: ranking.map(([s,]) => s),
                indicators: w.indicators,
                result: w.result?.result?.data,
                demand: w.demand,
            };
            text = JSON.stringify(json, null, "  ");

        } else {

            // create CSV download
            text = "sector code,sector name";
            if (w.demand) {
                text += ",demand";
            }
            if (w.result && w.indicators) {
                for (const i of w.indicators) {
                    text += `,"${i.code} - ${i.name} [${i.unit}]"`;
                }
                text += ",ranking";
            }
            text += "\n";

            for (const [sector, rank] of ranking) {
                text += `"${sector.code}","${sector.name}"`;
                if (w.demand) {
                    text += `,${w.demand[sector.code]}`;
                }
                if (w.result && w.indicators) {
                    for (const i of w.indicators) {
                        text += `,${w.result.getResult(i, sector)}`;
                    }
                    text += `,${rank}`;
                }
                text += "\n";
            }
        }

        // download file
        // see https://stackoverflow.com/a/33542499
        const blob = new Blob([text], {
            type: format === "JSON"
                ? "application/json"
                : "text/csv",
        });
        const file = format === "JSON"
            ? "heatmap.json"
            : "heatmap.csv";
        if ((window.navigator as any).msSaveBlob) {
                (window.navigator as any).msSaveBlob(blob, file);
        } else {
            const elem = window.document.createElement("a");
            const url = window.URL.createObjectURL(blob);
            elem.href = url;
            elem.download = file;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    };

    return (
        <div className="download-section">
            <span>Download: </span>
            <button className="download-link" onClick={() => onDownload("JSON")}>
                JSON
            </button>
            <span> | </span>
            <button className="download-link" onClick={() => onDownload("CSV")}>
                CSV
            </button>
        </div>
    );
};
