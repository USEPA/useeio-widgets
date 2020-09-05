
## Sector Categories

<!--

This is a low priority, but we can be on the lookout for:

A management icon that doesn’t show a hierarchy  
A less horizontal healthcare image
A real estate image without dollar sign
For retail, a detailed version of a storefront would be nice
Wholesale trade is a little busy
Construction is a little busy


Font Awesome
Add [Font Awesome Icons](https://fontawesome.com/). Example with Javascript tag:  

 <link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" integrity="sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p" crossorigin="anonymous"/>

<i class="fas fa-star" style="font-size: 32px"></i><br>   -->


<!-- Material Icons
We might also use [Material Design Icons](https://materialdesignicons.com/) ([Dev](https://dev.materialdesignicons.com/icons) - [CDN](https://cdn.materialdesignicons.com/5.2.45/))  

 <link id="fonts-googleapis-com-icon" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons" media="all">

<i class="showAppsX material-icons appIconX" style="font-size:32px">&#xE5C3;</i>   -->

[Indicators .csv file](https://github.com/modelearth/useeior/blob/master/inst/extdata/USEEIO_LCIA_Indicators.csv) is the source of abbreviations for USEEIO API.  Indicator icons will use the same abbreviations.  

The icons below are for <a href="https://www.cdc.gov/niosh/topics/coding/more.html">20 main categories</a> and the additional categories (Recycling, Bioproducts, Clean Energy, and Local Products. ) are in our <a href="sector-set.csv">sector-set.csv</a> file. Icons courtesy of <a href="https://thenounproject.com">TheNounProject.com</a><br>

We might [create an icon font using icomoon](https://theblog.adobe.com/weekoficons-prepare-svg-icons-for-icon-fonts/).  

<h2>SVG Icons</h2>

Some of the large verions (visual) will have more detail than the smaller (icon) version.  
The larger ones are intended for use in page graphic visuals.<br><br>

Recycling<br>  
<img id="REicon" src="sector/recycle.svg" width="10%" height="10%">
<img id="REicon" src="sector/recycle.svg" width = '3%' height = '3%'>  

Bioproducts<br>
<!--
<img id="REicon" src="sector/biomass.svg" width="10%" height="10%">
-->
<span class="material-icons" style="font-size:110px">spa</span>
<span class="material-icons">spa</span>
<!--<span class="material-icons">whatshot</span>-->  

Petrochemicals<br>  
<svg style="width:12%;height:12%;padding-right:5px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M3,2H6C6.28,2 6.53,2.11 6.71,2.29L8.79,4.38L9.59,3.59C10,3.2 10.5,3 11,3H17C17.5,3 18,3.2 18.41,3.59L19.41,4.59C19.8,5 20,5.5 20,6V19A2,2 0 0,1 18,21H8A2,2 0 0,1 6,19V13L6,12V8C6,7.5 6.2,7 6.59,6.59L7.38,5.79L5.59,4H3V2M11,5V7H17V5H11M11.41,11L9.41,9H8V10.41L10,12.41V15.59L8,17.59V19H9.41L11.41,17H14.59L16.59,19H18V17.59L16,15.59V12.41L18,10.41V9H16.59L14.59,11H11.41M12,13H14V15H12V13Z" />
</svg>
<svg style="width:4%;height:4%" viewBox="0 0 24 24">
    <path fill="currentColor" d="M3,2H6C6.28,2 6.53,2.11 6.71,2.29L8.79,4.38L9.59,3.59C10,3.2 10.5,3 11,3H17C17.5,3 18,3.2 18.41,3.59L19.41,4.59C19.8,5 20,5.5 20,6V19A2,2 0 0,1 18,21H8A2,2 0 0,1 6,19V13L6,12V8C6,7.5 6.2,7 6.59,6.59L7.38,5.79L5.59,4H3V2M11,5V7H17V5H11M11.41,11L9.41,9H8V10.41L10,12.41V15.59L8,17.59V19H9.41L11.41,17H14.59L16.59,19H18V17.59L16,15.59V12.41L18,10.41V9H16.59L14.59,11H11.41M12,13H14V15H12V13Z" />
</svg>

Clean Energy<br>  
<img id="CEicon" src="sector/greenenergy.svg" width="10%" height="10%">  

Local Products<br>  
<img id="LPicon" src="sector/localproduct.svg" width="10%" height="10%">  

## 20 Main Sectors

<link id="fonts-googleapis-com-icon" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons" media="all">
<style>
	h1:nth-of-type(1) {
	  color: darkblue;
	}
	h1:nth-of-type(2) {
	  color: green;
	}
	h1:nth-of-type(3) {
	  color: orange;
	}
	h1:nth-of-type(4) {
	  color: red;
	}
	svg {
	  width: 50px;
	  height: 50px;
	  fill: currentColor;
	  vertical-align: top;
	}
</style>

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/">
<defs>
<g id='icon-agriculture'>
  <path d="M84.6,65.6c-2.6,0.9-7,1.9-11.8,2.9c-1.8,2.7-4.9,5-9.8,5.7c-1.1,0.2-2.4,0.3-3.8,0.3c-3.4,0-7.3-0.5-11.7-1
    c-0.3,0-0.6-0.1-0.9-0.1c-1-0.1-1.9-0.9-2-2c-0.1-1.4,1.1-2.5,2.4-2.3c0.3,0,0.7,0.1,1,0.1c5.7,0.6,11,1.3,14.4,0.7
    c6.3-1,8.2-4.8,7.8-8c-0.3-2.6-2.1-5.2-5.2-5c-4.4,0.2-9.6-0.3-14.6-0.8c-5.7-0.6-11.7-1.1-15.9-0.5c-2.3,0.3-6.4,1.8-10.5,3.5
    c-1,0.4-2.9,1.2-2.9,1.2L2.7,65.6C1.1,66.1,0,67.5,0,69.2v16.5c0,2.2,1.9,3.9,4.1,3.8l17-1.4c8.5,3,19,6.3,25.1,6.8
    c12.4,1,36.9-13.1,43.8-17.7C97,72.7,92.3,63,84.6,65.6z"/>
  <path d="M50.9,51.4c4.1,0.4,8.3,0.8,12,0.8c0.6,0,1.3,0,1.9,0c0.1,0,0.3,0,0.5,0c5.1,0,9.2,3.9,9.7,9.4c0.1,0.6,0.1,1.1,0,1.7
    c4.5-1,6.8-1.6,8.1-2.1c1.4-0.5,2.7-0.7,4.1-0.7h0.2c0.4-1.3,0.6-2.6,0.6-4c0-6.8-5.1-12.3-11.7-13c-0.6-5.2-5-9.2-10.3-9.2
    c-1,0-1.9,0.2-2.8,0.4V23.2c3.5-0.9,8.3-2.8,11.8-6.6c4.5-4.9,5.6-11.7,5.9-14.9c0.1-1-0.8-1.8-1.8-1.7c-3.2,0.6-9.8,2.3-14.3,7.2
    c-1.8,2-3.1,4.3-4,6.5c-0.9-2.3-2.1-4.6-4-6.5C52.3,2.3,45.7,0.6,42.5,0c-1-0.2-1.9,0.6-1.8,1.7c0.3,3.3,1.4,10,5.9,14.9
    c3.5,3.8,8.4,5.7,11.8,6.6v11.1c-0.6-0.1-1.3-0.2-1.9-0.2c-5.1,0-9.3,3.6-10.2,8.4c-0.1,0-0.2,0-0.3,0c-5.3,0-9.8,3.5-11.3,8.3
    c1.2-0.1,2.6-0.2,4.1-0.2C42.5,50.6,46.7,51,50.9,51.4z"/>
</g>
<g id='icon-mining'>
	<path d="M28.3,26.4c-1.1-1.2-2.2-2.4-3.3-3.6L0.9,50c-1.2,1.3-1.2,3.6,0,4.9L3,57.3c1.2,1.3,3.2,1.3,4.4,0l24.2-27.2
		C30.5,28.9,29.5,27.7,28.3,26.4z"/>
	<path d="M31.5,22.8c7,7.9,12.9,16.1,17.5,23.8c0.8,1.3,2.7,0.8,2.8-0.9c0.4-7.4-3.5-17.4-10.5-26.6l2.1-2.4c1.2-1.3,1.2-3.6,0-4.9
		l-2.1-2.4c-1.2-1.3-3.2-1.3-4.4,0l-2.1,2.4C26.6,4,17.7-0.4,11.1,0c-1.5,0.1-2,2.2-0.8,3.1C17.3,8.3,24.6,15,31.5,22.8z"/>
	<path d="M61.9,44.5l5.3-11c0.3-0.7,0.1-1.7-0.6-2l-6-3.4c-0.9-0.4-1.9,0.2-1.9,1.3l0.8,14.4C59.5,45.3,61.4,45.7,61.9,44.5z"/>
	<path d="M36.2,47.1c-0.7-0.3-1.5,0.1-1.7,0.8L32.1,55c-0.4,1,0.4,2.1,1.4,1.9l12.6-2.4c1.3-0.2,1.5-2.2,0.3-2.8L36.2,47.1z"/>
	<path d="M88.5,11.3l-10.8,8.6c-0.8,0.6-1.3,1.5-1.6,2.5l-5.6,22.2c-0.2,0.9-0.7,1.7-1.3,2.2l-9,8.4c-0.5,0.3-0.9,0.6-1.4,0.9
		l-27,9.4c-0.5,0.1-0.9,0.1-1.3,0.2l-12.6-0.4c-0.8,0-1.6,0.6-1.8,1.5L14,74.4c-0.4,1.3,0.5,2.7,1.8,2.7h75.1c2.3,0,4.1-2,4.1-4.6
		V15.1C94.9,11.3,91.1,9.1,88.5,11.3z"/>
</g>
<g id='icon-utilities'>
<path d="M18.9,5.9h-4V1c0-0.5-0.4-1-1-1c-0.5,0-1,0.4-1,1l0,0v5H7V1c0-0.5-0.4-1-1-1C5.5,0,5,0.4,5,1v5H1C0.5,6,0,6.4,0,7v9.9
	c0,3.8,3.1,6.9,6.9,6.9h2v1.3c0,2,1.2,3.8,3.1,4.6c1.1,0.4,1.9,1.5,1.8,2.7v2.3c0,0.5,0.4,1,1,1s1-0.4,1-1l0,0v-2.3
	c0-2-1.2-3.8-3.1-4.6c-1.1-0.4-1.9-1.5-1.8-2.7v-1.3h2c3.8,0,6.9-3.1,6.9-6.9v-10C19.9,6.4,19.5,6,18.9,5.9z M13.6,13.7l-4.3,6.4
	c-0.2,0.3-0.5,0.4-0.8,0.4c-0.1,0-0.3,0-0.4-0.1c-0.4-0.2-0.7-0.6-0.6-1.1l0.6-3.5H7.2c-0.3,0-0.6-0.1-0.8-0.4
	c-0.2-0.3-0.2-0.6-0.1-0.9l1.4-4.7c0.1-0.4,0.5-0.7,0.9-0.7h2.9c0.3,0,0.6,0.1,0.8,0.4c0.2,0.3,0.2,0.6,0.1,0.9l-0.6,1.7h0.9
	c0.4,0,0.7,0.2,0.9,0.5C13.8,13,13.8,13.4,13.6,13.7z"/>
</g>
<g id='icon-construction'>
<polygon points="21.4,45.7 13.2,53.9 21.4,62.1"/>
<polygon points="10.7,91.6 18.8,83.5 10.7,75.4"/>
<polygon points="21.4,65.4 13.2,73.6 21.4,81.8"/>
<polygon points="10.7,35.9 10.7,52.1 18.8,44"/>
<polygon points="10.7,55.6 10.7,71.9 18.8,63.8"/>
<path d="M21.4,22.6V13H63v8h-5v12h18V21h-5v-8h5.8v-3H21.4V3l0,0V0H10.7v3l0,0v7H0v3h11.8L21.4,22.6z M68,21h-2v-8h2V21z"/>
<polygon points="21.4,25.9 13.2,34.1 21.4,42.3"/>
<polygon points="10.7,16.1 10.7,32.4 18.8,24.2"/>
<path d="M99,50v-3H83V30h-3v17H60v-5h-3v5.9l0,0V70H37V55.1h-3v16.1l0,0V93H21.4v-7.8L13.6,93H1v3h88v-3h-6V73h16v-3H83V50H99z
   M64,54h12v12H64V54z M41,77h12v12H41V77z M64,89V77h12v12H64z"/>
<rect x="92.1" y="93" width="5.9" height="3"/>
</g>

</defs>
</svg>


<h1>
  <svg viewBox="0 0 93.4 95">
    <use xlink:href="#icon-agriculture"></use>
  </svg>
  Agriculture, forestry, fishing, and hunting
</h1>
<h1>
  <svg viewBox="0 0 95 77.1">
    <use xlink:href="#icon-mining"></use>
  </svg>
  Mining, Quarrying, Oil, Gas Extraction
</h1>
<h1>
  <svg viewBox="0 0 19.8 35.7">
    <use xlink:href="#icon-utilities"></use>
  </svg>
  Utilities
  <span class="material-icons">electrical_services</span>  
</h1>
<h1>
  <svg viewBox="0 0 99 96">
    <use xlink:href="#icon-construction"></use>
  </svg>
  Construction
  <span class="material-icons">construction</span>
</h1>



 



Manufacturing<br>  
<img id="MAicon" src="sector/manufacturing.svg" width="10%" height="10%">  

Wholesale trade<br>  
<img id="WHicon" src="sector/wholesale.svg" width="10%" height="10%">  

Retail trade<br>  
<img id="REicon" src="sector/retail.svg" width="10%" height="10%">
<span class="material-icons">storefront</span>

Transportation and warehousing<br>  
<img id="TRicon" src="sector/transportation.svg" width="10%" height="10%">
<span class="material-icons">local_shipping</span>

Information<br>  
<img id="INicon" src="sector/information.svg" width="10%" height="10%">
<span class="material-icons">laptop_chromebook</span>

Finance and Insurance<br>  
<img id="FIicon" src="sector/finance.svg" width="10%" height="10%">
<span class="material-icons">monetization_on</span>

Real Estate and Rental and Leasing<br>  
<img id="REicon" src="sector/realestate.svg" width="10%" height="10%">
<span class="material-icons">house</span>
<br>

Professional and business services<br>  
<img id="BUicon" src="sector/business.svg" width="10%" height="10%">
<span class="material-icons">business_center</span>  
<br>

Management of Companies and Enterprises <br>
<img id="MAicon" src="sector/management.svg" width="10%" height="10%">
<span class="material-icons">group</span>

Educational Services<br>
<span class="material-icons" style="font-size:100px">school</span>
<span class="material-icons">school</span>

Health Care and Social Assistance<br>  
<!--
<img id="HEicon" src="sector/healthcare.svg" width="10%" height="10%">
<span class="material-icons">local_hospital</span>
-->
<i class="fas fa-hospital-user" style="font-size: 90px; padding-right:20px"></i>
<i class="fas fa-hospital-user" style="font-size: 28px"></i>
<br><br>  

Arts, entertainment, recreation<br>  
<img id="ARicon" src="sector/art.svg" width="10%" height="10%">
<span class="material-icons">color_lens</span>

Accommodation and Food Services<br>  
<img id="ACicon" src="sector/food.svg" width="10%" height="10%">
<span class="material-icons">restaurant_menu</span>

Public Administration<br>  
<img id="GOicon" src="sector/government.svg" width="10%" height="10%">
<span class="material-icons">account_balance</span>


<h2>Font Awesome Icons</h2>

Here are some [Font Awesome Icons](https://fontawesome.com/icons?d=gallery&m=free). Example with Javascript tag:  

We won't use these because they are too thick.  
<!-- Font Awesome -->
 <link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" integrity="sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p" crossorigin="anonymous"/>

<style>
	.f_icons i {
		font-size: 36px;
		margin-right:10px;
	}
</style>
<div class="f_icons">
<i class="fas fa-star"></i>
<i class="fas fa-balance-scale"></i>
<i class="fas fa-couch"></i>
<i class="fas fa-hospital-user"></i>
<i class="fas fa-atom"></i>
</div><br>


<h2>Google Material Icons</h2>

Here are some [Google Material Icons](https://material.io/resources/icons/?style=baseline) - [Material Design Icons](https://materialdesignicons.com/) ([Dev](https://dev.materialdesignicons.com/icons) - [CDN](https://cdn.materialdesignicons.com/5.2.45/))  

We're using these for the small version of the icon.<br>
These reside in the "icon" column.<br><br>

<!-- Material Icons -->
 <link id="fonts-googleapis-com-icon" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons" media="all">
<style>
	.material-icons { /* For small icons above */
		font-size: 40px;
		margin-left:15px;
	}
	.m_icons span {
		font-size: 48px;
		margin-left:0px;
	}
</style>
<div class="m_icons">
construction<br>
<span class="material-icons">construction</span><br><br>

engineering<br>
<span class="material-icons">engineering</span><br><br>

arts<br>
<span class="material-icons">color_lens</span><br><br>

government<br>
<span class="material-icons">account_balance</span><br><br>

retail<br>
<span class="material-icons">storefront</span><br><br>



Not using these (yet)<br><br>

<span class="material-icons">history_edu</span>
<span class="material-icons">science</span>
<span class="material-icons">anchor</span>
<span class="material-icons">architecture</span>
<span class="material-icons">commute</span>
<span class="material-icons">sports</span>
<span class="material-icons">airplanemode_active</span>
<span class="material-icons">psychology</span>
<span class="material-icons">apartment</span>
<span class="material-icons">thumb_up_alt</span>
<span class="material-icons">apps</span>
</div>



<h2>Unicode Icons</h2>

<a href="https://unicode-table.com/en/sets/facebook-symbols/">Unicode Icons</a> -
<a href="http://www.fileformat.info/info/unicode/font/index.htm">Fonts</a>

<style>
	.u_icons span {
		font-size: 42px;
		margin-right:9px;
		font-family: "Arial Unicode MS"
	}
</style>
<div class="u_icons">

Recycling<br>
<span name="recycling">&#9851;</span><br>

Closer look (used for markdown link)<br>
<span>&#128065;</span><br>

</div>


##How to add color to SVG files

We may need to store the path of each SVG icon within the CSV file to change the color.  <a href="https://css-tricks.com/cascading-svg-fill-color/">Source</a>  


<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;">
<defs>
<g id="icon-image">
    <path class="path1" d="M0 4v26h32v-26h-32zM30 28h-28v-22h28v22zM22 11c0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.657-1.343 3-3 3-1.657 0-3-1.343-3-3zM28 26h-24l6-16 8 10 4-3z"></path>
</g>
<g id="icon-play">
    <path class="path1" d="M30.662 5.003c-4.488-0.645-9.448-1.003-14.662-1.003-5.214 0-10.174 0.358-14.662 1.003-0.86 3.366-1.338 7.086-1.338 10.997 0 3.911 0.477 7.63 1.338 10.997 4.489 0.645 9.448 1.003 14.662 1.003 5.214 0 10.174-0.358 14.662-1.003 0.86-3.366 1.338-7.086 1.338-10.997 0-3.911-0.477-7.63-1.338-10.997zM12 22v-12l10 6-10 6z"></path>
</g>
<g id="icon-cart">
    <path class="path1" d="M30.549 6.077c-1.062-0.303-2.169 0.312-2.473 1.374l-0.157 0.549h-18.654l-0.281-2.248c-0.125-1.001-0.976-1.752-1.985-1.752h-5c-1.105 0-2 0.895-2 2s0.895 2 2 2h3.234l1.781 14.248c0.125 1.001 0.976 1.752 1.985 1.752h17c0.893 0 1.678-0.592 1.923-1.451l4-14c0.303-1.062-0.312-2.169-1.374-2.473zM16 16v-2h4v2h-4zM20 18v2h-4v-2h4zM16 12v-2h4v2h-4zM9.516 10h4.484v2h-4.234l-0.25-2zM10.016 14h3.984v2h-3.734l-0.25-2zM10.516 18h3.484v2h-3.234l-0.25-2zM24.491 20h-2.491v-2h3.063l-0.571 2zM25.634 16h-3.634v-2h4.206l-0.571 2zM26.777 12h-4.777v-2h5.349l-0.571 2zM8 29c0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.657-1.343 3-3 3-1.657 0-3-1.343-3-3zM20 29c0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.657-1.343 3-3 3-1.657 0-3-1.343-3-3z"></path>
</g>
<g id="icon-phone">
    <path class="path1" d="M22 20c-2 2-2 4-4 4s-4-2-6-4-4-4-4-6 2-2 4-4-4-8-6-8-6 6-6 6c0 4 4.109 12.109 8 16s12 8 16 8c0 0 6-4 6-6s-6-8-8-6z"></path>
</g>
</defs>
</svg>

<h1>
  <svg viewBox="0 0 32 32">
    <use xlink:href="#icon-phone"></use>
  </svg>
  Contact
</h1>

<h1>
  <svg viewBox="0 0 32 32">
    <use xlink:href="#icon-cart"></use>
  </svg>
   My Picks
</h1>

<h1>
  <svg viewBox="0 0 32 32">
    <use xlink:href="#icon-image"></use>
  </svg>
  Gallery
</h1>

<h1>
  <svg viewBox="0 0 32 32">
    <use xlink:href="#icon-play"></use>
  </svg>
  Play
</h1>
