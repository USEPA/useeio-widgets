import { TextField } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import * as React from "react";
import { Config } from "../../";

/**
 * The ListHeader is the top left header cell of an industry list. It contains
 * a paginator and a search field.
 */
export const ListHeader = (props: {
    onSearch: (term: string | null) => void,
}) => {

    const onSearch = (value: string) => {
        if (!value) {
            props.onSearch(null);
            return;
        }
        const term = value.trim().toLowerCase();
        props.onSearch(term.length === 0 ? null : term);
    };

    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                '& > *': {
                    margin: theme.spacing(1),
                    width: 400,
                },
            },
        }),
    );

    const classes = useStyles();

    return (
        <form className={classes.root} noValidate autoComplete="off">
            <TextField id="outlined-basic" label="Search" variant="outlined" size="small" onChange={e => onSearch(e.target.value)} />
        </form>
    );
};

const Paginator = (props: {
    total: number,
    config: Config,
    onChange: (config: Config) => void,
}) => {

    const [showCounter, setShowCounter] = React.useState<boolean>(false);

    // calculate the page count
    const total = props.total;
    const config = props.config;
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

    // page links
    const links: JSX.Element[] = [];
    const goTo = (nextPage: number) => {
        props.onChange({ page: nextPage });
    };
    if (page > 1) {
        links.push(
            <a key="paginator-prev"
                onClick={() => goTo(page - 1)}>
                Prev
            </a>
        );
    }
    const start = page > 3 ? page - 2 : 1;
    let end = start + 4;
    if (end > pageCount) {
        end = pageCount;
    }
    for (let i = start; i <= end; i++) {
        if (links.length > 0) {
            links.push(
                <span key={`paginator-sep-${i}`}
                    style={{ margin: "0 3px" }}>
                    |
                </span>
            );
        }
        if (i === page) {
            links.push(
                <span key={`paginator-${i}`}>
                    {i}
                </span>);
        } else {
            links.push(
                <a key={`paginator-${i}`}
                    onClick={() => goTo(i)}>
                    {i}
                </a>
            );
        }
    }
    if (page < pageCount) {
        links.push(
            <span key={`paginator-sep-next`}
                style={{ margin: "0 3px" }}>
                |
            </span>
        );
        links.push(
            <a key={`paginator-next`}
                onClick={() => goTo(page + 1)}>
                Next
            </a>
        );
    }

    // title
    const title = count > 0 && count < total
        ? `${count} of ${total} -- `
        : `${total} industry sectors`;


    // counter combo
    const counter: JSX.Element[] = [];
    if (!showCounter) {
        counter.push(
            <span
                key="paginator-arrowdown"
                className="arrowdown"
                style={{ cursor: "pointer" }}
                onClick={() => setShowCounter(true)} />
        );
    } else {
        const options = [-1, 10, 20, 30, 40, 50, 100].map(i => {
            const text = i === -1 ? "All" : i;
            return (
                <option value={i} key={`count-prop-${i}`}>
                    {text}
                </option>
            );
        });
        counter.push(
            <select
                key="paginator-counter"
                value={count}
                style={{ float: "right" }}
                onChange={(e) => {
                    const c = parseInt(e.target.value, 10);
                    props.onChange({ count: c, page: 1 });
                }}>
                {options}
            </select>
        );
        counter.push(
            <span
                key="paginator-arrowright"
                className="arrowright"
                style={{ cursor: "pointer" }}
                onClick={() => setShowCounter(false)} />
        );
    }

    return (
        <span className="matrix-sub-title">
            {title}
            {links}
            {counter}
        </span>
    );
};
