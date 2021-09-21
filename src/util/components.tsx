import { CircularProgress, Grid } from "@material-ui/core";
import React from "react";

export const LoadingComponent = () => {
    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            justify="center"
            style={{ minHeight: '75vh' }}
        >
            <Grid item >
                <CircularProgress disableShrink />
            </Grid>
        </Grid>
    );
};
