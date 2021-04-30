import { DemandType, ResultPerspective } from "./webapi";

/**
 * A common configuration object of our widgets. Often our widgets take the same
 * configuration options regarding the data they present (e.g. the codes of
 * industry sectors or indicators).
 */
export interface Config {

    [key: string]: any;

    /**
     * The ID of the input output model
     */
    model?: string;

    /**
     * An array of sector codes.
     */
    sectors?: string[];

    /**
     * A possible additional array of NAICS sector codes. We translate them to
     * BEA codes when parsing the confiration.
     */
    naics?: string[];

    /**
     * An array of indicator codes.
     */
    indicators?: string[];

    /**
     * An array of indicator codes for the heatmap that will be displayed.
     */
    view_indicators?: string[];

    /**
     * The result perspective.
     */
    perspective?: ResultPerspective;

    /**
     * The type of the demand vector.
     */
    analysis?: DemandType;

    /**
     * The year of the demand vector.
     */
    year?: number;

    /**
     * An optional location code to filter sectors
     * by location in multi-regional models.
     */
    location?: string;

    /**
     * The number of items a widget should display.
     * This is typically the number of sectors.
     */
    count?: number;

    /**
     * Can be used together with the `count` property
     * to page through a number of items.
     */
    page?: number;

    /**
     * `view=mosaic` is currently used in the industry list widget
     * to switch between a plain sector list or the real heatmap.
     */
    view?: string[];

    /**
     * Indicates if result values should be shown in a widget.
     */
    showvalues?: boolean;

    /**
     * Indicates if result values should be shown in scientific notation or not.
     */
    showscientific?: boolean;

    /**
     * Indicates whether the matrix selector should be shown or not.
     */
    selectmatrix?: boolean;

    /**
     * Indicates whether download links should be shown or not.
     */
    showdownload?: boolean;

    /**
     * Indicates whether code examples should be displayed.
     */
    showcode?: boolean;
}
