import { render } from "react-dom";
import { Widget, Config } from "../";
import React from "react";
import { createStyles, List, ListItem, makeStyles, Theme } from "@material-ui/core";

export class FilterWidget extends Widget {

    private selector: string;
    config: Config;
    constructor(selector: string) {
        super();
        this.selector = selector;
        this.ready();
    }

    async handleUpdate(config: Config) {
        this.config = config;
        render(<FilterComponent widget={this} />,
            document.querySelector(this.selector));
        this.ready();
    }
}

const FilterComponent = ({ widget: { config } }: { widget: FilterWidget }) => {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                width: "100%",
                maxWidth: 360,
                backgroundColor: theme.palette.background.paper
            }
        })
    );
    const classes = useStyles();
    const showPerspective = (config: Config): string | undefined => {
        if (!config.perspective)
            return undefined;
        switch (config.perspective) {
            case "direct":
                return "Supply chain";
            case "final":
                return "Point of consumption";
            default:
                return undefined;
        }
    };

    return (
        <div className="useeio-filter-widget">
            <List
                component="nav"
                aria-labelledby="list"
                className={classes.root}
            >
                <ListItem>
                    <b>Perspective : </b>&nbsp;{showPerspective(config)}
                </ListItem>
                <ListItem>
                    <b>Analysis type: </b> &nbsp;{config.analysis ? ' ' + config.analysis : "Nothing selected"}
                </ListItem>
                <ListItem >
                    <b>Year: </b> &nbsp;{config.year ? config.year : "Nothing selected"}
                </ListItem>
                <ListItem >
                    <b>Location: </b>&nbsp;{config.location ? config.location : "Nothing selected"}
                </ListItem>
            </List>
        </div>
    );
};
