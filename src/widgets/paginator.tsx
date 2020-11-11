import * as React from "react";
import * as ReactDOM from "react-dom";

import { Widget, Config } from "../widget";
import { Model } from "../webapi";

export class Paginator extends Widget {

    private _totalCount: number;

    constructor(private model: Model, private selector: string) {
        super();
        this.ready();
        this.handleUpdate({});
    }

    protected async handleUpdate(config: Config) {

        // calculate the number of pages
        const total = await this.totalCount();
        if (total === 0) {
            return;
        }
        let count = config.count || -1;
        if (count > total) {
            count = total;
        }
        const pageCount = count > 0
            ? Math.ceil(total / count)
            : 0;

        // select the page
        let page = config.page || 1;
        if (page <= 0) {
            page = 1;
        }
        if (page > pageCount) {
            page = pageCount;
        }

        // render the component
        const props: PaginatorProps = {
            count,
            page,
            pageCount,
            widget: this,
        };
        ReactDOM.render(
            <Component {...props} />,
            document.querySelector(this.selector));
    }

    private async totalCount(): Promise<number> {
        if (this._totalCount) {
            return this._totalCount;
        }
        const isMultiRegional = await this.model.isMultiRegional();
        if (!isMultiRegional) {
            this._totalCount = (await this.model.sectors()).length;
            return this._totalCount;
        }
        // in case of multi-regional models we use the number of
        // unique sector codes as total count
        const ids: { [code: string]: boolean } = {};
        const sectors = await this.model.sectors();
        let count = 0;
        for (const sector of sectors) {
            if (ids[sector.code]) {
                continue;
            }
            count++;
            ids[sector.code] = true;
        }
        this._totalCount = count;
        return this._totalCount;
    }
}

type PaginatorProps = {
    count: number;
    page: number;
    pageCount: number;
    widget: Widget;
};

const Component = (props: PaginatorProps) => {
    const selector = props.pageCount > 1
        ? <PageSelector {...props} />
        : <></>;
    return (
        <table className="useeio-paginator">
            <tbody>
                <tr>
                    <CountCombo {...props} />
                    {selector}
                </tr>
            </tbody>
        </table>
    );
};

const PageSelector = (props: PaginatorProps) => {
    const page = props.page;
    const start = page > 4 ? page - 3 : 1;
    let end = start + 6;
    if (end > props.pageCount) {
        end = props.pageCount;
    }
    const items: JSX.Element[] = [];

    const goTo = (nextPage: number) => {
        props.widget.fireChange({ page: nextPage });
    };

    // add the `prev` link
    if (page > 1) {
        items.push(
            <td className="paginator-previous"  key="paginator-previous">
                <a onClick={() => goTo(page - 1)}>Prev</a>
            </td>
        );
    }

    // add the page links
    for (let i = start; i <= end; i++) {
        const key = `paginator-page-${i}`;
        if (i === page) {
            items.push(
                <td key={key} className="paginator-number paginator-selected">
                    <span>{i}</span>
                </td>
            );
        } else {
            items.push(
                <td key={key} className="paginator-number">
                    <a onClick={() => goTo(i)}>{i}</a>
                </td>
            );
        }
    }

    // add the `next` link
    if (page < props.pageCount) {
        items.push(
            <td className="paginator-next" key="paginator-next">
                <a onClick={() => goTo(page + 1)}>Next</a>
            </td>
        );
    }

    return <>{items}</>;
};

const CountCombo = (props: { count: number, widget: Widget }) => {
    const options = [-1, 10, 20, 30, 40, 50, 100].map(i => {
        const text = i === -1 ? "All" : i;
        return (
            <option value={i} key={`count-prop-${i}`}>
                {text}
            </option>
        );
    });
    return (
        <>
            <td className="paginator-counter">
                <select value={props.count} onChange={(e) => {
                    const count = parseInt(e.target.value, 10);
                    props.widget.fireChange({ count });
                }}>
                    {options}
                </select>
            </td>
        </>);
};