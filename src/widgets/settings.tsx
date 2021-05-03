import * as strings from "../util/strings";
import { Widget, Config } from "../";
import {
    DemandType,
    Model,
    ResultPerspective,
} from "../webapi";

import { createStyles, makeStyles, Theme, Select, FormControl, MenuItem, InputLabel, Grid } from "@material-ui/core";
import ReactDOM from "react-dom";
import React, { ChangeEvent } from "react";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        formControl: {
            margin: theme.spacing(1),
            minWidth: 120,
        },
        selectEmpty: {
            marginTop: theme.spacing(2),
        },
    }),
);

export interface SettingsWidgetConfig {
    selector: string;
    model: Model;
}

export class SettingsWidget extends Widget {

    private demandTypes: DemandType[] = [];
    years: number[] = [];
    locations: string[] = [];
    config: Config;
    constructor(private settingsConfig: SettingsWidgetConfig) {
        super();
    }

    async init() {
        if (!this.settingsConfig || !this.settingsConfig.model) {
            return;
        }

        // start request
        const model = this.settingsConfig.model;
        const sectors = model.sectors();
        const demands = model.demands();

        // get possible locations from sectors
        (await sectors).forEach(sector => {
            if (!sector.location) {
                return;
            }
            const loc = sector.location;
            if (this.locations.indexOf(loc) < 0) {
                this.locations.push(loc);
            }
        });
        this.locations.sort(strings.compare);

        // get demand types and years from demand infos
        (await demands).forEach(d => {
            if (d.type && this.demandTypes.indexOf(d.type) < 0) {
                this.demandTypes.push(d.type);
            }
            if (d.year && this.years.indexOf(d.year) < 0) {
                this.years.push(d.year);
            }
        });

        this.demandTypes.sort(strings.compare);
        this.years.sort();

    }

    async update(config: Config) {
        this.config = config;
        ReactDOM.render(
            <SettingsComponent widget={this} />,
            document.querySelector(this.settingsConfig.selector)
        );
    }
}

const SettingsComponent = ({ widget }: { widget: SettingsWidget }) => {
    return (
        <Grid container justify="center" >
            <PerspectiveComponent widget={widget} />
            <AnalyseComponent widget={widget} />
            <YearComponent widget={widget} />
            <LocationComponent widget={widget} />
        </Grid>
    );
};

const PerspectiveComponent = ({ widget }: { widget: SettingsWidget }) => {
    const classes = useStyles();

    const config = widget.config;
    const perspective: ResultPerspective = config.perspective
        ? config.perspective
        : "direct";
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        widget.fireChange({ perspective: e.target.value as ResultPerspective });
    };
    return (
        <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel id="perspectiveLabel">Perspective</InputLabel>
            <Select
                labelId="perspectiveLabel"
                id="perspectiveSelect"
                value={perspective}
                onChange={handleChange}
                label="Perspective"
            >
                <MenuItem value={"direct"}>Suppy chain</MenuItem>
                <MenuItem value={"final"}>Point of consumption</MenuItem>
            </Select>
        </FormControl>
    );
};

const AnalyseComponent = ({ widget }: { widget: SettingsWidget }) => {
    const classes = useStyles();

    const config = widget.config;
    const type: DemandType = config.analysis
        ? config.analysis
        : "Consumption";
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        widget.fireChange({ analysis: e.target.value as DemandType });
    };
    return (
        <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel id="analyseLabel">Analysis type</InputLabel>
            <Select
                labelId="analyseLabel"
                id="analyseId"
                value={type}
                onChange={handleChange}
                label="Analysis type"
            >
                <MenuItem value={"Consumption"}>Consumption</MenuItem>
                <MenuItem value={"Production"}>Production</MenuItem>
            </Select>
        </FormControl>
    );
};

const YearComponent = ({ widget }: { widget: SettingsWidget }) => {
    const classes = useStyles();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        widget.fireChange({
            year: parseInt(e.target.value, 10)
        });
    };
    let firstYear: number;
    const menuItem = widget.years.map((year) => {
        if (!firstYear) {
            firstYear = year;
        }
        return <MenuItem key={year} value={year}>{year}</MenuItem>;
    });
    return (
        <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel id="yearLabel">Year</InputLabel>
            <Select
                labelId="yearLabel"
                id="yearId"
                value={firstYear}
                onChange={handleChange}
                label="Year"
            >
                {
                    menuItem
                }
            </Select>
        </FormControl>
    );
};

const LocationComponent = ({ widget }: { widget: SettingsWidget }) => {
    const classes = useStyles();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        widget.fireChange({ location: e.target.value as DemandType });
    };
    let firstLocation: string;
    const menuItem = widget.locations.map((location) => {
        if (!firstLocation) {
            firstLocation = location;
        }
        return <MenuItem key={location} value={location}>{location}</MenuItem>;
    });
    return (
        <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel id="locationLabel">Location</InputLabel>
            <Select
                labelId="locationLabel"
                id="locationId"
                value={firstLocation}
                onChange={handleChange}
                label="Location"
            >
                {
                    menuItem
                }
            </Select>
        </FormControl>
    );
};
