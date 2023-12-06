import { Box, Button, Menu, MenuItem } from "@material-ui/core";
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import * as React from "react";
import { FC, useState } from "react";
import * as ReactDOM from "react-dom";
import { Config } from "../config";
import { WebModel } from "useeio";
import { Widget } from "../widget";


export class DotsMenu extends Widget {

    config: Config;
    constructor(private model: WebModel, private selector: string) {
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


const Component: FC<{ widget: DotsMenu }> = ({ widget }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const showSettingFilter = !!widget.config.showsettings;
    const showAboutSection = !!widget.config.showabout;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickSetting = () => {
        handleClose();
        if (widget.config.showsettings === undefined || widget.config.showsettings === showSettingFilter)
            widget.fireChange({ showsettings: !showSettingFilter });
    };

    const handleClickAbout = () => {
        handleClose();
        if (widget.config.showabout === undefined || widget.config.showabout === showAboutSection)
            widget.fireChange({ showabout: !showAboutSection });
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
