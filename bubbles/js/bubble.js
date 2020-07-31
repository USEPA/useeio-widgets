// `hashChangeEvent` event reside in multiple widgets. 
// Called by goHash +-++localsite.js
let dataObject1={};
var element = document.querySelector('#industry-list');

sect_list=[]
//dropdown population code
/*
drop_down_list();
$("#state").change(drop_down_list);
$(window).load(drop_down_list);
// Drop down code from: https://www.bitrepository.com/dynamic-dependant-dropdown-list-us-states-counties.html
function drop_down_list(){
    var state = $('#state').val();

    if(state == 'AK' || state == 'DC') // Alaska and District Columbia have no counties
    {
    $('#county_drop_down').hide();
    $('#no_county_drop_down').show();
    }
    else
    {
        $('#loading_county_drop_down').show(); // Show the Loading...
        
        $('#county_drop_down').hide(); // Hide the drop down
        $('#no_county_drop_down').hide(); // Hide the "no counties" message (if it's the case)

        $.getScript("js/states/"+ state.toLowerCase() +".js", function(){

            populate(document.form.county);

            $('#loading_county_drop_down').hide(); // Hide the Loading...
            $('#county_drop_down').show(); // Show the drop down
        });
    }
}*/

d3.selectAll("#county").on("change",function(){
  console.log("county changed")
    updateHash({"naics":d3.select("#county").node().value});
})
par={}
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type == "attributes") {

      par.naics=document.getElementById('industry-list').getAttribute('data-naics').slice(0,10)
      if(document.getElementById("mySelect").checked){
          midFunc(params.x,params.y,params.z,par,"region");
          document.querySelector('#sector-list').setAttribute('area', 'GAUSEEIO');
      }else{
          midFunc(params.x,params.y,params.z,par,"all");
          document.querySelector('#sector-list').setAttribute('area', 'USEEIO');
      }
    }
  });
});

observer.observe(element, {
  attributes: true //configure it to listen to attribute changes
});

document.addEventListener('hashChangeEvent', function (elem) {

  
  console.log("bubble chart detects hash changed")
  params = loadParams(location.search,location.hash);
  params = mix(params,param); // Gives priority to params, param includes include path value and page settings.
  if(params.x){dropdown.val(params.x)}
  if(params.y){dropdown2.val(params.y)}
  if(params.z){dropdown3.val(params.z)}
  
  //readyfunc();
    if(counter==2){
        counter=0
    }
    if(counter==0){  
      geo_list[0]=params.geo
      if(geo_list[1]){
        lastgeo=geo_list[1]
        currgeo=geo_list[0]
        if(typeof lastgeo!='undefined'){
          if (lastgeo.includes(",")){
              lastgeo=lastgeo.split(",")
              lastgeo=(lastgeo[0].split("US")[1]).slice(0,2)
          }else{
              lastgeo=(lastgeo.split("US")[1]).slice(0,2)
          }
        }
        if(typeof currgeo!='undefined'){
          if (currgeo.includes(",")){
              currgeo=currgeo.split(",")
              currgeo=(currgeo[0].split("US")[1]).slice(0,2)
          }else{
              currgeo=(currgeo.split("US")[1]).slice(0,2)
          }
        }
      }else{
        lastgeo=[]
        currgeo=geo_list[0]
        if(typeof currgeo!='undefined'){
          if (currgeo.includes(",")){
              currgeo=currgeo.split(",")
              currgeo=(currgeo[0].split("US")[1]).slice(0,2)
          }else{
              currgeo=(currgeo.split("US")[1]).slice(0,2)
          }
        }
      }
    }else{
    geo_list[1]=params.geo
    lastgeo=geo_list[0]
    currgeo=geo_list[1]
    if(typeof lastgeo!='undefined'){
      if (lastgeo.includes(",")){
          lastgeo=lastgeo.split(",")
          lastgeo=(lastgeo[0].split("US")[1]).slice(0,2)
      }else{
          lastgeo=(lastgeo.split("US")[1]).slice(0,2)
      }
    }
    if(typeof currgeo!='undefined'){
      if (currgeo.includes(",")){
          currgeo=currgeo.split(",")
          currgeo=(currgeo[0].split("US")[1]).slice(0,2)
      }else{
          currgeo=(currgeo.split("US")[1]).slice(0,2)
      }
    }
    }

    
    if(lastgeo!=currgeo){
      readyfunc();
    }
    counter=counter+1



  if(document.getElementById("mySelect").checked){
      midFunc(params.x,params.y,params.z,params,"region");
      document.querySelector('#sector-list').setAttribute('area', 'GAUSEEIO');
  }else{
      midFunc(params.x,params.y,params.z,params,"all");
      document.querySelector('#sector-list').setAttribute('area', 'USEEIO');
  }

  console.log("params.naics: "+params.naics)
  
}, false);

//params = loadParams(location.search,location.hash);
//params = mix(params,param); // Gives priority to params, param includes include path value and page settings.
//console.log("initial params.naics: " + params.naics)

//getting the listof indicators and populating the x and y dropdown options
let dropdown = $('#graph-picklist-x');
dropdown.empty();
const url = './data/indicators.json';
// Populate dropdown with list of provinces
$.getJSON(url, function (data) {
  $.each(data, function (key, entry) {
    dropdown.append($('<option></option>').attr('value', entry.code).text(entry.name));
  })
});



let dropdown2 = $('#graph-picklist-y');
dropdown2.empty();
// Populate dropdown with list of provinces
$.getJSON(url, function (data) {
  $.each(data, function (key, entry) {
    dropdown2.append($('<option></option>').attr('value', entry.code).text(entry.name));
  })
});



let dropdown3 = $('#graph-picklist-z');
dropdown3.empty();
// Populate dropdown with list of provinces
$.getJSON(url, function (data) {
  $.each(data, function (key, entry) {
    dropdown3.append($('<option></option>').attr('value', entry.code).text(entry.name));
  })
});






var parentId = "#graph-wrapper";
var animDuration = 1200;
var margin = {top: 40, right: 50, bottom: 55, left: 95};
var width = 1000 - margin.left - margin.right,    
    height = 450  - margin.top - margin.bottom;

var xScale = d3.scaleLog()
    .range([0,width])
    .clamp(true);

var yScale = d3.scaleLog()
    .range([height, 0])
    .clamp(true);

var line = d3.line();

var zScale = d3.scalePow()
  .exponent(0.2)
    .range([2,40]);


var myTickFormat = function (d) {//Logic to reduce big numbers
  var f = d3.format(".1f");
  var limits = [1000000000, 1000000, 1000];
  var shorteners = ['B','M','K'];
  if(d>=1000){
    for(var i in limits) {
      if(d > limits[i]) {
        d=(d/limits[i]).toFixed(2) + shorteners[i];
      }
    }
  }else if(d>=0.000001 && d<1000){
    d=parseFloat((d).toFixed(7).toString())
  }else{
    for(j=-6;j>=-24;j--){
      if(d>=Math.pow(10,j-1) && d<Math.pow(10,j)){
        d=(d*Math.pow(10,1-j)).toFixed(1)+"*10^-"+(1-j)
      }
    }
    
  }
  return d;
};

var xAxis = d3.axisBottom()
    .scale(xScale)
    .tickSize(-height)
    .tickPadding(8)

    
    .ticks(8,myTickFormat)

var yAxis = d3.axisLeft()
    .scale(yScale)
    .tickSize(-width)
    .tickPadding(8)


     .ticks(5,myTickFormat)

var svg = d3.select(parentId).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("id","svg-parent")
      .append("g")
      .attr("id","graph-plane")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height) + ")")

    .call(xAxis.ticks(8,myTickFormat))
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)").style("text-anchor", "start");

svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate("  +0+ ",0)")
    .call(yAxis.ticks(5,myTickFormat));

svg.append("path")
    .attr("class","trendline")
    .attr("stroke-width", 1)
    .style("stroke","steelblue")
    .style("fill","none");

var gradient = svg.append("svg:defs")
  .append("svg:radialGradient")
    .attr("id", "gradient")
    .attr("cx", "50%")    //The x-center of the gradient
    .attr("cy", "50%")    //The y-center of the gradient
    .attr("r", "50%")  //The radius of the gradient
    .attr("spreadMethod", "pad");

gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", "#F6BDC0")
    .attr("stop-opacity", 1);

gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "red")
    .attr("stop-opacity", 1);



// For rollover popup
var div = d3.select(parentId).append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);



function getDimensions(x,y,z){
  var returnX=[];
  var returnY=[];
  var returnZ=[];
  var returnPairs = [];
  allData.forEach(function(d){
    var pair = {x: d[x],y: d[y],z:d[z],industry_detail:d["industry_detail"],industry_code:d["industry_code"],ACID:d["ACID"],
    ENRG:d["ENRG"],ETOX:d["ETOX"],EUTR:d["EUTR"],FOOD:d["FOOD"],GCC:d["GCC"],HAPS:d["HAPS"],
    HAZW:d["HAZW"],HC:d["HC"],HNC:d["HNC"],HRSP:d["HRSP"],HTOX:d["HTOX"],JOBS:d["JOBS"],
    LAND:d["LAND"],METL:d["METL"],MINE:d["MINE"],MSW:d["MSW"],NREN:d["NREN"],OZON:d["OZON"],
    PEST:d["PEST"],REN:d["REN"],SMOG:d["SMOG"],VADD:d["VADD"],WATR:d["WATR"]}; // CUSTOM, appended year for chart, the rest for popup
    returnPairs.push(pair);
    returnX.push(d[x]);
    returnY.push(d[y]);
    returnZ.push(d[z]);
  });
  return {x:returnX,y:returnY,z:returnZ,pairs:returnPairs};
}

function updateTitle(x,y,z){
d3.json("data/indicators.json").then(function(consdata){
    var filteredData = consdata.filter(function(d) {
      if(d["id"]==x) {
        unitx=d["unit"]
      }
      if(d["id"]==y) {
        unity=d["unit"]
      }
      if(d["id"]==z) {
        unitz=d["unit"]
      }
    })
    $(document).ready(function () { 
      if(dataObject1.stateshown==13){
        document.getElementById("bubble-graph-title").innerHTML = "Georgia Industries"
      }else{
        document.getElementById("bubble-graph-title").innerHTML = "US Industries"
      }
      //$("#impactText").html(z + "<br>" + y + "<br>" + x);
      //$("#impactText2").html(z + "<br>" + y + "<br>" + x); // Using jquery avoid error if element is not in page.
      document.getElementById("unit-x").innerHTML = unitx;
      document.getElementById("unit-y").innerHTML = unity;
      document.getElementById("unit-z").innerHTML = unitz;
    });
  })
}


// returns slope, intercept and r-square of the line
//Pulled from http://bl.ocks.org/benvandyke/8459843
function leastSquares(xSeries, ySeries) {
  var reduceSumFunc = function(prev, cur) { return prev + cur; };
  
  var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
  var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

  var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
    .reduce(reduceSumFunc);
  
  var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
    .reduce(reduceSumFunc);
    
  var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
    .reduce(reduceSumFunc);
    
  var slope = ssXY / ssXX;
  var intercept = yBar - (xBar * slope);
  var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
  
  return [slope, intercept, rSquare];
}
//http://snipplr.com/view/37687/random-number-float-generator/
function randomFloatBetween(minValue,maxValue,precision){
    if(typeof(precision) == 'undefined'){
        precision = 2;
    }
    return parseFloat(Math.min(minValue + (Math.random() * (maxValue - minValue)),maxValue).toFixed(precision));
}

//"draw" the line with many points respecting the calculated bubble-graph-equation
function calculateLineData(leastSquares,xRange,iterations){
  var returnData = [];
  for(var i=0; i<iterations; i++){
    var randomX = randomFloatBetween(xRange[0],xRange[1]);
    returnData.push({
      xVal:randomX,
      yVal: (randomX*leastSquares[0])+leastSquares[1]
    });
  }
  return returnData;
}




var allData
$( document ).ready(readyfunc());
let geo_list={}
counter=0
function readyfunc(){
  
  dataObject1.stateshown=13;
  let params = loadParams(location.search,location.hash);
  if(params["geo"]){
      geo=params["geo"]
      if (geo.includes(",")){
          geos=geo.split(",")
          dataObject1.stateshown=(geos[0].split("US")[1]).slice(0,2)
      }else{
          dataObject1.stateshown=(geo.split("US")[1]).slice(0,2)
      }

  }
  if(dataObject1.stateshown=='13'){
    model='_GA'
  }else{
    model=''
  }
  console.log("bbbbb"+model)
  d3.csv("data/indicators_sectors"+model+".csv").then(function(data){


    data.forEach(function(d) {

        d.ACID = +d.ACID;
        
        d.ENRG= +d.ENRG;
        d.ETOX=+d.ETOX
        d.EUTR=+d.EUTR
        d.FOOD=+d.FOOD
        d.GCC=+d.GCC
        d.HAPS=+d.HAPS
        d.HAZW=+d.HAZW
        d.HC=+d.HC
        d.HNC=+d.HNC
        d.HRSP=+d.HRSP
        d.HTOX=+d.HTOX
        d.JOBS=+d.JOBS
        d.LAND=+d.LAND
        d.METL=+d.METL
        d.MINE=+d.MINE
        d.MSW=+d.MSW
        d.NREN=+d.NREN
        d.OZON=+d.OZON
        d.PEST=+d.PEST
        d.REN=+d.REN
        d.SMOG=+d.SMOG
        d.VADD=+d.VADD
        d.WATR=+d.WATR
      });

    allData = data;

    let params = loadParams(location.search,location.hash);
    params = mix(params,param); // Gives priority to params, param includes include path value and page settings.
    console.log("lllllll " + params.naics)
    if (params.x && params.y && params.z) {
      $("#graph-picklist-x").val(params.x);
      $("#graph-picklist-y").val(params.y);
      $("#graph-picklist-z").val(params.z);
    } else { // Same as below
      $("#graph-picklist-x").val('ENRG');
      $("#graph-picklist-y").val('WATR');
      $("#graph-picklist-z").val('LAND');
    }
    document.getElementById("mySelect").onchange = function() {myFunction()};
function myFunction() {
  if(document.getElementById("mySelect").checked){
    midFunc(d3.select("#graph-picklist-x").node().value,
        d3.select("#graph-picklist-y").node().value,
        d3.select("#graph-picklist-z").node().value,
        params,"region")
    document.querySelector('#sector-list').setAttribute('area', 'GAUSEEIO');
  }else{
    midFunc(d3.select("#graph-picklist-x").node().value,
        d3.select("#graph-picklist-y").node().value,
        d3.select("#graph-picklist-z").node().value,
        params,"all")
    document.querySelector('#sector-list').setAttribute('area', 'USEEIO');
  }
  }
    if(document.getElementById("mySelect").checked){
    midFunc(d3.select("#graph-picklist-x").node().value,
        d3.select("#graph-picklist-y").node().value,
        d3.select("#graph-picklist-z").node().value,
        params,"region");
    document.querySelector('#sector-list').setAttribute('area', 'GAUSEEIO');
    }else{
      midFunc(d3.select("#graph-picklist-x").node().value,
        d3.select("#graph-picklist-y").node().value,
        d3.select("#graph-picklist-z").node().value,
        params,"all");
      document.querySelector('#sector-list').setAttribute('area', 'USEEIO');
    }
      


      d3.selectAll(".graph-picklist").on("change",function(){
        goHash({"x":$("#graph-picklist-x").val(),"y":$("#graph-picklist-y").val(),"z":$("#graph-picklist-z").val()});
        //updateChart(d3.select("#graph-picklist-x").node().value,
        ///  d3.select("#graph-picklist-y").node().value,
        //  d3.select("#graph-picklist-z").node().value);
      }) 
  });
};



var ordinalDomain = ["1-100m", "100-500m", "500m-1km", "1-5km", "5-10km", "Over 10km"];
var ordinal = d3.scaleOrdinal() // Becomes scaleOrdinal in v4
  .domain(ordinalDomain)
  .range(["blue","#7479BC","#BDE7AE","#ECF809","orange","magenta"]); // Not in use here, from wind/js/regression.js

function midFunc(x,y,z,params,boundry){
  console.log("ggg")
  if(params.naics){
    console.log("params.naics " + params.naics)
    naicsList=params.naics.split(",")
    useeioList=[]
    useeiodetail=[]
    // TO DO: Add a path root here
    d3.csv("/input-output/bubbles/data/Crosswalk_MasterCrosswalk.csv").then( function(consdata) {
      var filteredData = consdata.filter(function(d) {
        for(i=0;i<naicsList.length;i++){
            if(d["2012_NAICS_Code"]==naicsList[i]) {
              useeioList.push(d["USEEIO1_Code"])
              useeiodetail.push(d["USEEIO1_Commodity"])
            }
          }
        })
      console.log("ddddddd"+useeioList)
      console.log("ddddddd"+useeiodetail)
      updateChart(x,y,z,useeioList,boundry)
    })
  
  }else{updateChart(x,y,z,[],boundry)}

}

function updateChart(x,y,z,useeioList,boundry){
  if(typeof countload=='undefined'){
    countload=0
    countload+=1
    updateChart(x,y,z,useeioList,boundry)
  }
console.log("hhh")
  console.log("updateChart - x:"+ x + " y:" + y + " z:" + z);
  if (!(x && y && z)) { // Same as above
    x = 'ENRG';
    y = 'WATR';
    z = 'LAND';
  }

  
  //Fetch data
  var records = getDimensions(x,y,z);
  updateTitle(x,y,z);
  x1=x;
  y1=y;
  z1=z;
  boundry1=boundry;
  (records.y).sort(function(a,b){return a-b});
  var l = (records.y).length;
  var low = Math.round(l * 0.010);
  var high = l - low;
  records.y = (records.y).slice(low,high);

  (records.x).sort(function(a,b){return a-b});
  var l = (records.x).length;
  var low = Math.round(l * 0.010);
  var high = l - low;
  records.x = (records.x).slice(low,high);

  (records.pairs).sort(function(a,b){return a-b});
  var l = (records.pairs).length;
  var low = Math.round(l * 0.010);
  var high = l - low;
  records.pairs = (records.pairs).slice(low,high);
  
  yScale.domain(d3.extent(records.y));
  xScale.domain(d3.extent(records.x));
  zScale.domain(d3.extent(records.z));
  //re-assign data (or assign new data)
  var selectedCircles = d3.select("#graph-plane")
    .selectAll(".circles")
    .data(records.pairs)
    .attr('pointer-events', 'auto')

  //give a transition on the existing elements
  selectedCircles
    .transition().duration(animDuration)

    .attr("transform",function(d){return "translate("+xScale(d.x)+","+yScale(d.y)+")";})
    .attr("r",function(d){
      return zScale(d.z)+2
    })
    .style('fill', function (d) { 
      if(boundry1=="region"){
        if(useeioList.length>0){
          if(d3.select(this).attr("class")!='circles selected'){
            if (useeioList.includes( d.industry_code) ) {
              return "url(#gradient)";
            } else {
              return "#303030";
            }
          }else{return 'yellow'}
        }else{
          if(d3.select(this).attr("class")!='circles selected'){
              return "#303030";
          }else{return 'yellow'}
        }
      }else{
        if(d3.select(this).attr("class")!='circles selected'){
              return "url(#gradient)";
                }else{return 'yellow'}
      }
          })


    
    .style("stroke","black")
    .attr("stroke-width", function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 1
      }else{return 6}
    })
    .attr("stroke-opacity", function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 0.7
      }else{
          return 1
      }
    })
    .style("fill-opacity" , function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 0.5
      }else{
          return 1
      }
    })
    //.attr("stroke-width", 20)
    //console.log("plaaaa"+x)
    
    //Append any new elements and transition them as well
    selectedCircles.enter()
      .append("circle")
      .style('fill', function (d) { 
      if(boundry1=="region"){
        if(useeioList.length>0){
          if(d3.select(this).attr("class")!='circles selected'){
            if (useeioList.includes( d.industry_code) ) {

              return "url(#gradient)";
            } else {
              return "#303030";
            }
          }else{return 'yellow'}
        }else{
          if(d3.select(this).attr("class")!='circles selected'){
          return "#303030";}else{return 'yellow'}
        }
      }else{
        if(d3.select(this).attr("class")!='circles selected'){
              return "url(#gradient)";
            }else{return 'yellow'}

      }
          })
            .attr("stroke-width", function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 1
      }else{return 6}
    })
    .attr("stroke-opacity", function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 0.7
      }else{
          return 1
      }
    })
    .style("fill-opacity" , function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 0.5
      }else{
          return 1
      }
    })
        //.classed("norm", true)
      .on("mouseover", function(d) {
        if(d3.select(this).attr("class")!='circles selected'){
        d3.select(this)
        .transition()
        .style("fill-opacity",1)
        .attr('stroke-width', 4)
        .attr("stroke-opacity", 1)
        }
        div.transition()
          .duration(200)
          .style("opacity", .9);               
          div.html('<span style="color: black" >'+"<b style='font-size:1.3em'>" + d.industry_detail + "</b><br/><b> " +x1+":</b> "+d.x+ "<br/><b> " +y1+":</b> "+ d.y + "<br/><b>" +z1+":</b> "+ d.z+'</span >')
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");                     
      })



                     

      .on("click", function(d,i) {
          console.log('boundry'+boundry1)
        //d3.selectAll(".circles").classed("selected", false);
        d3.selectAll(".circles").style('fill', function (d) { 
      if(boundry1=="region"){
        if(useeioList.length>0){
          if(d3.select(this).attr("class")!='circles selected'){
            if (useeioList.includes( d.industry_code) ) {
              return "url(#gradient)";
            } else {
              return "#303030";
            }
          }else{return "yellow"}
        }else{
          if(d3.select(this).attr("class")!='circles selected'){
              return "#303030";
            }else{return "yellow"}
        }
      }else{
        if(d3.select(this).attr("class")!='circles selected'){
              return "url(#gradient)";
                }else{return "yellow"}
      }
          })
                    .attr("stroke-width", function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 1
      }else{return 6}
    })
    .attr("stroke-opacity", function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 0.7
      }else{
          return 1
      }
    })
    .style("fill-opacity" , function (d) { 
      if(d3.select(this).attr("class")!='circles selected'){
        return 0.5
      }else{
          return 1
      }
    })
        d3.select(this)
        .transition()
        .style("fill","yellow")
        .style("fill-opacity",1)
        .attr('stroke-width', 6)
        .attr("stroke-opacity", 1)
        d3.select(this).classed("selected", true)
        
        console.log(d3.select(this).attr("class"))
        document.getElementById("impactText").innerHTML ='<font size="5">'+ d.industry_detail+"</font>"+"<br>"+ z1 +":"+d.z+ "<br>" + y1 +":"+d.y+ "<br>" + x1+":"+d.x;
        document.getElementById("impactText2").innerHTML +="<br>"+ '<font size="5">'+d.industry_detail+"</font>"+"<br>"+z1 +":"+d.z+ "<br>" + y1 +":"+d.y+ "<br>" + x1+":"+d.x;
        create_bar(d,x,y,z,x1,y1,z1);
        //updateHash({"sectors":d.industry_code});
        sect_list.push(d.industry_code.toUpperCase())
        console.log("sects"+sect_list)
        console.log(typeof sect_list[0])
        document.querySelector('#sector-list').setAttribute('sector', sect_list);

      })


      .on("mouseout", function(d) {
        if(d3.select(this).attr("class")!='circles selected'){
        d3.select(this)
        .transition()

        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.7)
        .style("fill-opacity" , 0.5)

       } 
        div.transition()
          .duration(500)
          .style("opacity", 0);
                        
      })

      


      .attr("class","circles")
      .attr("r",function(d){
        return zScale(d.z)+2
      })
                    
      
      .style("stroke","black")
      .attr("stroke-opacity", 0.7)
    .style("fill-opacity" , 0.5)
    //.classed("norm", true)
      .transition().duration(animDuration)
      .attr("transform",function(d){return "translate("+xScale(d.x)+","+yScale(d.y)+")";});


  //Remove any dom elements which are no longer data bound
  selectedCircles.exit().remove();
                  
  //Update Axes
  d3.select(parentId).select(".x.axis").transition().duration(animDuration).call(xAxis.ticks(8,myTickFormat))
    .selectAll("text").attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)").style("text-anchor", "start");
  d3.select(parentId).select(".y.axis").transition().duration(animDuration).call(yAxis.ticks(5,myTickFormat));


}


function create_bar(d,x,y,z,x1,y1,z1){
  //console.log("ws"+x1+y1+z1)
  //console.log("vals"+d.x+d.y+d.z)
  d3.select("#selected_bar").remove();

  var svg3 = d3.select("#barchart")
      .append("svg")
      .attr("width", width)
      .attr("height", 380)
      .attr("class", "bar-chart")
      .attr('id', 'selected_bar');
  maxim=Math.max(d.x,d.y,d.z)      
  var rect_scale = d3.scaleLinear().range([300,0]).domain([maxim,0]);
  var axis_scale = d3.scaleLinear().range([300,0]).domain([0,maxim]);
  var other_scale = d3.scaleBand().range([0, 300]).domain([x1,y1,z1]);

  var chart_2 = svg3.append('g').attr('class', 'y axis')
      .attr('transform', 'translate(325, 60)').call(d3.axisLeft(axis_scale));

  chart_2.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,300)').call(d3.axisBottom(other_scale));

  chart_2.append("text")
      .attr('class', 'label')
      .attr("transform", "translate(150, 350)")
      .text("Attr").attr("fill", "black").style("font-size", "25px");

  /*chart_2.append("text")
      .attr('class', 'label')
      .attr("transform", "translate(-50, 170) rotate(-90)")
      .text("y axis")
      .attr("fill", "black")
      .style("font-size", "25px");*/

  chart_2.append("text")
      .attr('class', 'title')
      .style('text-anchor','middle')
      .attr('transform', 'translate(130,-30)')
      .text( d.industry_detail)
      .attr("fill", "black").style("font-size", "20px");




  svg3.append("rect").attr("y", 360 - rect_scale(d.x)).attr("x", 355)
      .attr("width", 50).attr("height", rect_scale(d.x)).attr("fill", "red");

  svg3.append("rect").attr("y", 360 - rect_scale(d.y)).attr("x", 450)
      .attr("width", 50).attr("height", rect_scale(d.y)).attr("fill", "green");

  svg3.append("rect").attr("y", 360 - rect_scale(d.z)).attr("x", 550)
      .attr("width", 50).attr("height", rect_scale(d.z)).attr("fill", "blue");



}