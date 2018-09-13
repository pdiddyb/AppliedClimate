
//************************************ Merge power outage model output with tract ID ********************************************
// Retrived data from csv file content
var urlBase = window.location.href.replace("/index.html","") + "/";

var url = urlBase + "HPOM/sample.csv";
var request = new XMLHttpRequest();  //This is deprecated. We need to change this
request.open("GET", url, false);
request.send(null);

var csvData = new Array();
var jsonObject = request.responseText.split(/\r?\n|\r/);
for (var i = 0; i < jsonObject.length; i++) {
  csvData.push(jsonObject[i].split(','));
};

// Read tract ID
function Get(yourUrl){
    var Httpreq = new XMLHttpRequest(); // A new request
    Httpreq.open("GET",yourUrl,false);
    Httpreq.send(null);
    return Httpreq.responseText;
};

var HPOM = JSON.parse(Get( urlBase + 'HPOM/TXctract.geojson'));

for (var i = 0; i < HPOM.features.length; i++) {
    HPOM.features[i].properties.power = 0;
    HPOM.features[i].properties.people = 0;
};

// Merge
for (var j = 0; j < HPOM.features.length; j++) {
    var flag = 0;
	for (var i = 1; i < jsonObject.length; i++) {
		result= csvData[i];
        if (result[0]===HPOM.features[j].properties.GEOID) {
        HPOM.features[j].properties.power = (result[16]*100).toFixed(0);
		HPOM.features[j].properties.people = (result[16]*result[1]).toFixed(0);
		flag =1;
        }
    }

	if(flag === 0){
	   delete HPOM.features[j];
	   HPOM.features = HPOM.features.filter(function( element ) {
               return element !== undefined;
       });
	   j--;
    };
};


//******************************************* Map HPOM output with hover-over function ******************************************
// Set variable for map and initialize
var mymap =  L.map('mapid', {
    center: [28.3, -97.2],
    zoom: 7.5,
});
  mymap.createPane('radar');

  // This pane is above markers but below popups
  mymap.getPane('radar').style.zIndex = 650;

  // Layers in this pane are non-interactive and do not obscure mouse/touch events
  mymap.getPane('radar').style.pointerEvents = 'none';

function getfillOpacity() {
    return $('#hpomopacity').val() * '.01'
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.power),
        weight: 1,
        opacity:1,
        color: getColor(feature.properties.power),
        fillOpacity: getfillOpacity()
    };
};

function style1(feature) {
    return {
        fillColor: getColor_P(feature.properties.people),
        weight: 1,
        opacity:1,
        color: getColor_P(feature.properties.people),
        fillOpacity: getfillOpacity()
    };
};

// Opacity Slider
$('#hpomopacity').on('input', function (value) {
    $('.hpom-transparency').css({
        fillopacity: $(this).val() * '.01'
    });
    geojson.setStyle(style);
    geojson_P.setStyle(style1);
});

function style2(feature) {
    return {
        fillColor: false,
		    fillOpacity:0,
        weight: 0.3,
        opacity:1,
		//dashArray: '1',
        color: 'white'

    };
};

// Change color
	function getColor(d) {
    return d > 60  ? '#800026' :
           d > 50  ? '#BD0026' :
           d > 40  ? '#E31A1C' :
           d > 30  ? '#FC4E2A' :
           d > 20  ? '#FD8D3C' :
           d > 10  ? '#FEB24C' :
                     '#FFEDA0' ;
};

   function getColor_P(d) {
    return d > 3000   ? '#800026' :
           d > 2500   ? '#BD0026' :
           d > 2000   ? '#E31A1C' :
           d > 1500   ? '#FC4E2A' :
           d > 1000   ? '#FD8D3C' :
           d > 500    ? '#FEB24C' :
                        '#FFEDA0' ;
};


// Add interactions
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.5
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

	info.update(layer.feature.properties);

};

function resetHighlight(e) {
    geojson.setStyle(style);
	info.update();
	if(flagww==1){
        watch_warning.bringToFront();
    };
};

function zoomToFeature(e) {
    mymap.fitBounds(e.target.getBounds());
};

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
};

// Interactions when HPOM_P layer is on
function resetHighlight1(e) {
    geojson_P.setStyle(style1);
	info.update();
	if(flagww==1){
        watch_warning.bringToFront();
    };
};

function onEachFeature1(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight1,
        click: zoomToFeature
    });
};

// Interactions when wind/&surge layer is on
function resetHighlight2(e) {
    geojson2.setStyle(style2);
	info.update();
	if(flagww==1){
        watch_warning.bringToFront();
    };
};

function onEachFeature2(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight2,
        click: zoomToFeature
    });
};

LHPOM     = L.geoJson(HPOM, {style: style}).addTo(mymap);
LHPOM_P   = L.geoJson(HPOM, {style: style1});
LHPOM2    = L.geoJson(HPOM, {style: style2});

geojson = L.geoJson(HPOM, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(mymap);
geojson_P = L.geoJson(HPOM, {
    style: style1,
    onEachFeature: onEachFeature1
});
geojson2 = L.geoJson(HPOM, {
    style: style2,
    onEachFeature: onEachFeature2
});

// Add info control
var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // Create a div with a class "info"
    this.update();
    return this._div;
};

// Method that we will use to update the info control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>HPOM Output</h4>' +  (props ?
        '<b>Tract: ' + props.GEOID + '</b><br /> Population Affected: '+ props.people+ '</b><br /> Percentage: '+
		props.power + ' %' : 'Hover over a census tract');
};

info.addTo(mymap);


//********************************************* Add hurricane map layers ********************************************************
// Style of forecast track&cone
var myStyle1 = {
"color": "#0000ff",
"fillColor":"#99ccff",
"weight": 2.5,
"fillOpacity": 0.4
};

// Style of watches&warnings
var myStyle2 = {
"color": "#00ff00",
"weight": 3,
};

// Style of storm surge probabilities
function myStyle3(feature) {
    return {
        fillColor: getsurgeColor(feature.properties.SURGE10),
        weight: 0,
        color: getsurgeColor(feature.properties.SURGE10),
        fillOpacity: 0.86
    };
};

function getsurgeColor(d) {
    return d > 6  ?  '#000080' :
           d > 5  ?  '#0000cc' :
           d > 4  ?  '#1a1aff' :
           d > 3  ?  '#4d4dff' :
           d > 2  ?  '#8080ff' :
           d > 1  ?  '#b3b3ff' :
                     '#e6e6ff' ;
};

// Style of wind speed probabilities
function myStyle4(feature) {
    return {
        fillColor: getwindColor(feature.properties.PERCENTAGE),
        weight: 1,
        color: getwindColor(feature.properties.PERCENTAGE),
        fillOpacity: 0.86
    };
};
function getwindColor(d) {
	    return d ==">90%" ?  '#270000' :
	       d =="80-90%"   ?  '#6f0000' :
	       d =="70-80%"   ?  '#930000' :
	       d =="60-70%"   ?  '#934a00' :
	       d =="50-60%"   ?  '#939300' :
           d =="40-50%"   ?  '#4a9300' :
           d =="30-40%"   ?  '#009393' :
           d =="20-30%"   ?  '#006edb' :
           d =="10-20%"   ?  '#48a4ff' :
           d =="5-10%"    ?  '#90c8ff' :
           d =="<5%"      ?  '#d8ecff' :
		                     '#e6e6ff' ;

};

 // Create hurricane layers from external REST services (NHC)
var track_forecast = L.esri.dynamicMapLayer({
	url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
	layers:[5,6,16,17,27,28,38,39,49,50]},{style: myStyle1});
var watch_warning  = L.esri.dynamicMapLayer({
	url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
	layers:[7,18,29,40,51]},{style: myStyle2});
var Psurge = L.esri.dynamicMapLayer({
	url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
	layers:[14,25,36,46,58]},{style: myStyle3});
var Pwind34 = L.esri.dynamicMapLayer({
	url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
	layers:[59]},{style: myStyle4});
var Pwind50 = L.esri.dynamicMapLayer({
	url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
	layers:[60]},{style: myStyle4});
var Pwind64 = L.esri.dynamicMapLayer({
	url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
	layers:[61]},{style: myStyle4});

var check_number = 0;	// Number of total checked boxes
var wind_number  = 0;   // Number of checked boxes of wind(34Kt&50Kt&64Kt)
function getLayer(value){
    check_number = 0;
	wind_number  = 0;

    track_forecast.remove();
	watch_warning.remove();
	Psurge.remove();
	Pwind34.remove();
	Pwind50.remove();
	Pwind64.remove();
	if(!(flagpower==0 && flagpeople==0)){
	   LHPOM2.remove();
       geojson2.remove();
	};
	legend_surge.remove();
	legend_wind.remove();

	if(flagpower==1){
       LHPOM.addTo(mymap);
       geojson.addTo(mymap);
	   legend.addTo(mymap);
	};
	if(flagpeople==1){
	   LHPOM_P.addTo(mymap);
       geojson_P.addTo(mymap);
	   legend_P.addTo(mymap);
	};

	document.getElementById("myCheck1").checked = false;
	document.getElementById("myCheck2").checked = false;
	document.getElementById("myCheck3").checked = false;
	document.getElementById("myCheck4").checked = false;
	document.getElementById("myCheck5").checked = false;
	document.getElementById("myCheck6").checked = false;

	if(value=="sample"){

	  // Sample hurricane layers: 2017 Harvey #15
	  track_forecast = new L.Shapefile('HPOM/al092017_5day_015.zip',
	  {style: myStyle1});
	  watch_warning  = new L.Shapefile('HPOM/al092017-015_ww_wwlin.zip',
	  {style: myStyle2});
	  Psurge  = new L.Shapefile('HPOM/al092017_esurge10_2017082400.zip',
	  {style: myStyle3});
	  Pwind34 = new L.Shapefile('HPOM/2017082400_wsp_120hr5km34.zip',
	  {style: myStyle4});
	  Pwind50 = new L.Shapefile('HPOM/2017082400_wsp_120hr5km50.zip',
	  {style: myStyle4});
	  Pwind64 = new L.Shapefile('HPOM/2017082400_wsp_120hr5km64.zip',
	  {style: myStyle4});

	}else{

    // Using external REST services
      track_forecast = L.esri.dynamicMapLayer({
		url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
		layers:[5,6,16,17,27,28,38,39,49,50]},{style: myStyle1});
	  watch_warning  = L.esri.dynamicMapLayer({
		url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
		layers:[7,18,29,40,51]},{style: myStyle2});
	  Psurge = L.esri.dynamicMapLayer({
		url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
		layers:[14,25,36,46,58]},{style: myStyle3});
	  Pwind34 = L.esri.dynamicMapLayer({
		url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
		layers:[59]},{style: myStyle4});
	  Pwind50 = L.esri.dynamicMapLayer({
		url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
		layers:[60]},{style: myStyle4});
	  Pwind64 = L.esri.dynamicMapLayer({
		url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/NHC_Atl_trop_cyclones/MapServer/',
		layers:[61]},{style: myStyle4});
	};
};

//*************************************************** Add base map layers *******************************************************
// Create basemap layers -- basemaps http://leaflet-extras.github.io/leaflet-providers/preview/
var topo = L.esri.basemapLayer("Topographic");
var gray = L.esri.basemapLayer("Gray");
var imagery = L.esri.basemapLayer("ImageryClarity");
// Nighttime light
var blkmarble = L.tileLayer(
 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_Black_Marble/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
 {bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
  minZoom: 1,
  maxZoom: 8,
  format: 'png',
  time: '',
  tilematrixset: 'GoogleMapsCompatible_Level'}
);
var radar = L.esri.dynamicMapLayer({
	url:'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/',
	layers:[3],
  pane: 'radar'
});
var basemaplabels = L.esri.basemapLayer("ImageryLabels");

// Initialize map with the imagery basemap and labels
imagery.addTo(mymap);
basemaplabels.addTo(mymap);

// Create layer controls to change basemaps
var baseMaps ={
	"Topographic":topo,
    "Black Marble":blkmarble,
    "Imagery":imagery,
    "Light Gray":gray
};

var overlayMaps = {
    "Radar":radar,
    "Labels":basemaplabels
};

L.control.layers(baseMaps, overlayMaps, {position: 'bottomleft', collapsed:false}).addTo(mymap);


//******************************************************** Legend ***************************************************************
// Legend of HPOM output (percentage)
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 10, 20, 30, 40, 50, 60],
    labels = [];
    // Loop through our percentage intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] +'%'+'<br>' :'%+');
    }
    return div;
};
legend.addTo(mymap);

// Legend of HPOM output (population)
var legend_P = L.control({position: 'bottomright'});
legend_P.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 500, 1000, 1500, 2000, 2500, 3000],
    labels = [];
    // Loop through our percentage intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor_P(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] +'<br>' :'+');
    }
    return div;
};

// Legend of storm surge probabilities
var legend_surge = L.control({position: 'bottomright'});
legend_surge.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades_surge = [0, 1, 2, 3, 4, 5, 6],
    labels = [];
    for (var i = 0; i < grades_surge.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getsurgeColor(grades_surge[i] + 0.1) + '"></i> ' +
            grades_surge[i] + (grades_surge[i + 1] ? '&ndash;' + grades_surge[i + 1] +'%'+'<br>' :'%+');
    }
    return div;
};

// Legend of wind speed probabilities
var legend_wind = L.control({position: 'bottomright'});
legend_wind.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades_wind = [0,5, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    grades =["<5%","5-10%","10-20%","20-30%","30-40%","40-50%","50-60%","60-70%","70-80%","80-90%",">90%"]
	labels = [];
    for (var i = 0; i < grades_wind.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getwindColor(grades[i]) + '"></i> ' +
            grades_wind[i] + (grades_wind[i + 1] ? '&ndash;' + grades_wind[i + 1] +'%'+'<br>' :'%+');
    }
    return div;
};

//***************************** Function used to add and remove layers via a checkbox *******************************************
// Checkbox function for HPOM output
var flagpower    = 1;  // Whether LHPOM layer is on
var flagpeople   = 0;  // Whether LHPOM_P layer is on
function addLayerToMap_HPOM(element, layer) {

    if (element.checked){

      	if(layer==LHPOM){
		   flagpower    = 1;
		   flagpeople   = 0;
		   document.getElementById("Check2").checked = false;
		   LHPOM_P.remove();
		   geojson_P.remove();
		   legend_P.remove();
		   // Add layer when Psurge and Pwind layers are all closed
		   if(check_number==0){
	          LHPOM.addTo(mymap);
		      geojson.addTo(mymap);
		      legend.addTo(mymap);
		   };
	    }else{
		   flagpeople   = 1;
		   flagpower    = 0;
		   document.getElementById("Check1").checked = false;
		   LHPOM.remove();
		   geojson.remove();
		   legend.remove();
		   if(check_number==0){
		      LHPOM_P.addTo(mymap);
		      geojson_P.addTo(mymap);
              legend_P.addTo(mymap);
		   };
		};
		 // Keep track_forecast and watch_warning layers on top
		if(flagtrack==1){
		      track_forecast.bringToFront();
		   };
        if(flagww==1){
              watch_warning.bringToFront();
           };

    } else {

        if(layer==LHPOM){
		   flagpower    = 0;
	       LHPOM.remove();
		   geojson.remove();
		   legend.remove();
	    }else{
		   flagpeople    = 0;
		   LHPOM_P.remove();
		   geojson_P.remove();
           legend_P.remove();
		};
	};
 	if(flagpower==0 && flagpeople==0){
		LHPOM2.addTo(mymap);
		geojson2.addTo(mymap);
	}
};

var flagtrack    = 0;  // Whether track_forecast layer is on
var flagww       = 0;  // Whether watch_warning layer is on

// Checkbox function for track_forecast and watch_warning
function addLayerToMap(element, layer) {

    if (element.checked){
	    if(layer==track_forecast){
	       flagtrack = 1;
	    };
	    if(layer==watch_warning){
	       flagww    = 1;
	    };
		layer.addTo(mymap);

    } else {

		if(layer==track_forecast){
	       flagtrack = 0;
	    };
	    if(layer==watch_warning){
	       flagww    = 0;
	    };
		layer.remove();
	};
};


// Checkbox function for Psurge and Pwind
function addLayerToMap2(element, layer) {
    if (element.checked){
		check_number ++;
		legend.remove();
		legend_P.remove();
		if(layer==Psurge){
	        legend_surge.addTo(mymap);
	    }else{
			wind_number ++;
		    legend_wind.addTo(mymap);
		};

		layer.addTo(mymap);

		LHPOM.remove();
		geojson.remove();
		LHPOM_P.remove();
		geojson_P.remove();
		LHPOM2.remove();
		geojson2.remove();
		LHPOM2.addTo(mymap);
		geojson2.addTo(mymap);


    } else {
		check_number --;

		if(layer==Psurge){
	        legend_surge.remove();
	    }else{
			wind_number --;
			if(wind_number == 0){
				legend_wind.remove();
			};
		};

		if(check_number==0){
           layer.remove();
		   if(!(flagpower==0 && flagpeople==0)){
	          LHPOM2.remove();
              geojson2.remove();
	       };
           if(flagpower==1){
		      LHPOM.addTo(mymap);
		      geojson.addTo(mymap);
			  legend.addTo(mymap);
		   };
		   if(flagpeople==1){
		      LHPOM_P.addTo(mymap);
		      geojson_P.addTo(mymap);
			  legend_P.addTo(mymap);
		   };
		   if(flagtrack==1){
		      track_forecast.bringToFront();
		   };
           if(flagww==1){
              watch_warning.bringToFront();
           };
        }else{
		   layer.remove();
		};
    };
	if(flagtrack==1){
		      track_forecast.bringToFront();
    };
    if(flagww==1){
              watch_warning.bringToFront();
    };
};


//*****************************************************  Add info pop-up ********************************************************
function popup(id) {
    var popup = document.getElementById(id);
    popup.classList.toggle("show");
};


//****************************************************** Download files *********************************************************
function downloadObjectAsCsv(exportObj, exportName){
    var dataUrl = "HPOM/sample.csv";
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataUrl);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

function downloadObjectAsJson(exportObj, exportName){
    var jsonData = new Blob([JSON.stringify(exportObj)], { type: 'application/json' });
    var dataUrl = URL.createObjectURL(jsonData);
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataUrl);
    downloadAnchorNode.setAttribute("download", exportName + ".geojson");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

var flag1 = 0;  // Whether download original csv
var flag2 = 0;  // Whether download merged geojson

function FunctionEF1() {
	var checkBox = document.getElementById("EF1");
    if (checkBox.checked == true){
        flag1 = 1;
    } else {
        flag1 = 0;
    }
};

function FunctionEF2() {
	var checkBox = document.getElementById("EF2");
    if (checkBox.checked == true){
        flag2 = 1;
    } else {
        flag2 = 0;
    }
};

function download() {
	if (flag1 ===1){
	downloadObjectAsCsv(csvData, "HPOM");
	};
	if (flag2 ===1){
	downloadObjectAsJson(HPOM, "HPOM_merged");
	};
};

//****************************************************** Add search function ****************************************************
flag = 0; // Whether tract_ID can be found
function search(){
	x = document.getElementById("ID").value;
	for (var j = 0; j < HPOM.features.length; j++) {
      if (x===HPOM.features[j].properties.GEOID) {
        var percentage = HPOM.features[j].properties.power;
        var population = HPOM.features[j].properties.people;
        var Lfeature   = L.geoJson(HPOM.features[j]);
		flag =1;
        };
    };

	if(flag ===0){
	alert('No Tract Found');}else
	{
	// Zoom in to searched tract
	mymap.fitBounds(Lfeature.getBounds());
    alert('TractID: '+ x+ '\n' + 'Population affected: ' + population +'\n'+'Percentage: '+ percentage +'%');
	flag = 0;
	};
};

//******************************************************* Print snapshot ********************************************************
L.easyPrint({
	filename:"HPOMmap",
	position: 'topleft',
	sizeModes: ['A4Portrait', 'A4Landscape'],
	exportOnly: true
}).addTo(mymap);
