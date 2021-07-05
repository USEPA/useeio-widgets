import * as React from "react";
import * as ReactDOM from "react-dom";

import { Config } from "../config";
import { Model } from "../webapi";
import { Widget } from "../widget";
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { Box, Button, Menu, MenuItem } from "@material-ui/core";
import { useEffect, useState } from "react";

export class DotsMenu extends Widget {

    config: Config;
    constructor(private model: Model, private selector: string) {
        super();
        this.update({});
        this.config = null;
    }

    async update(config: Config) {
        this.config = config;

        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this.selector));
    }
}


const Component = (props: { widget: DotsMenu }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showSettingFilter, setShowSettingFilter] = useState(!(props.widget.config.showsettings === false));
    const [showAboutSection, setShowAboutSection] = useState(!(props.widget.config.showabout === false));


    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        props.widget.fireChange({ showsettings: showSettingFilter });
    }, [showSettingFilter]);



    const handleClickSetting = () => {
        handleClose();
        setShowSettingFilter((prevState) => {
            const newState = !prevState;
            props.widget.fireChange({ showsettings: newState });
            return newState;
        });
    };

    const handleClickAbout = () => {
        handleClose();
        setShowAboutSection((prevState) => {
            const newState = !prevState;
            props.widget.fireChange({ showabout: newState });
            return newState;
        });
    };

    return (
        <div>
            <Box display="flex" justifyContent="flex-end" m={1} p={1} bgcolor="background.paper">
                <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                    <MoreHorizIcon />
                </Button>
                <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem onClick={handleClickSetting}>{`${showSettingFilter ? "Hide" : "Show"} settings filter`} </MenuItem>
                    <MenuItem onClick={handleClickAbout}>{`${showAboutSection ? "Hide" : "Show"} about section`}</MenuItem>
                </Menu>
            </Box>
        </div>
    );
};
