import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
//import esri = __esri;
import { loadModules } from 'esri-loader';
import { loadCss } from 'esri-loader';
import { FeaturesProvider } from '../../providers/features/features';
import { Platform } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {
  @ViewChild('map') mapEl: ElementRef;
  @ViewChild('layers') layerEl: ElementRef;
  @ViewChild('basemaps') basemapsEl: ElementRef;
  view = null;
  // get MapView(){
  //   return this.view;
  // }
  facilities = [];
  parks =[];
  greenways = [];  
  layerList;
  basemapsGallery;
  connected:boolean;
  arcgisLoaded:boolean = false;
  constructor(public navCtrl: NavController, public features:FeaturesProvider, public platform:Platform) {
  }
  async getGeo() {
    await this.platform.ready();
    loadCss('https://js.arcgis.com/4.8/esri/themes/dark/main.css');   
    const [WebMap, MapView]:any = await loadModules(['esri/WebMap', 'esri/views/MapView'])
    .catch(err => { console.error("ArcGIS: ", err)});
        let map = new WebMap({portalItem: {
          id: 'a15f13756c6144939ea46d6a49387b0c'
        }})
        // map.when((webmap) => {
        //   console.log("webmap.layers: ",webmap.layers)
          
        // });
        this.view = new MapView({
          container: this.mapEl.nativeElement,
          map: map
        });
        this.view.popup.dockEnabled = true;
        this.view.popup.dockOptions =  {
          position: 'bottom-center',
          buttonEnabled: false,
          breakpoint: false
        }; 
        this.view.when((view) => {
          console.log("this.vioew.when")
          this.mapLoaded();
          console.log('view.map.layers.length: ' + view.map.layers.length)
          view.map.layers.forEach(function(layer){
            const fl = view.map.findLayerById(layer.id)
          })
        });
  }
  mapLoaded() {
    this.features.zoomto.subscribe(obj =>
      {
     if (obj && this.view) {
       this.view.goTo(obj.feature);
       this.view.popup.open({features:[obj.feature]});
       console.log('feature: ' + JSON.stringify(obj.feature))
       loadModules(["esri/Graphic"])
      .then(([Graphic]) => {
        let g;
        let existingSymbol; 
        console.log("obj: " + JSON.stringify(obj))
        if(obj.feature.geometry.hasOwnProperty("paths")){
          console.log("item.geometry.paths: " + obj.feature.geometry.paths)
          existingSymbol = this.getExistingSymbol(obj.layertitle);
          var lineSymbol = {
            type: "simple-line", // autocasts as new SimpleLineSymbol()
            color: [66,244,244], // RGB color values as an array
            width: 7
          };
          obj.feature.geometry.type="polyline";
          console.log("polyline feature: " + JSON.stringify(obj.feature))
          console.log("polyline feature.geometry: " + JSON.stringify(obj.feature.geometry))
          console.log("polyline feature.geometry.type: " + JSON.stringify(obj.feature.geometry.type))
          g = new Graphic({geometry:obj.feature.geometry, symbol:lineSymbol});
          console.log("g: " + JSON.stringify(g));
          this.view.graphics.removeAll();
          this.view.graphics.add(g);
        }
        else if(obj.feature.geometry.hasOwnProperty("x")&&obj.feature.geometry.hasOwnProperty("y")){
          console.log("item.geometry.hasOwnProperty(x): " + obj.feature.geometry.x)
          console.log("item.geometry.hasOwnProperty(y): " + obj.feature.geometry.y)
          existingSymbol = this.getExistingSymbol(obj.layertitle);
          var markerSymbol = {
            type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
            color: [66,244,244],
            outline: {
              // autocasts as new SimpleLineSymbol()
              color: [255, 255, 255],
              width: 2
            }
          };
          obj.feature.geometry.type="point";
          console.log("point feature: " + JSON.stringify(obj.feature))
          g = new Graphic({geometry:obj.feature.geometry, symbol:markerSymbol});
          console.log("g: " + JSON.stringify(g));
          //g.symbol = markerSymbol;
          
          this.view.graphics.removeAll();
          this.view.graphics.add(g);
        }
      })
     }
   });       
    this.loadWidgets();
    let layer = this.view.map.basemap.baseLayers as any;
    layer.items[0].when((event) => {
      this.arcgisLoaded = true;
      this.features.setArcGisLoaded(true);
    });
    
    this.detectMapChange();    
    this.queryLayers();
  }
  queryLayers() {
    this.features.nearbySelected.subscribe((selected) => {
      if (selected) {
        loadModules(['esri/layers/FeatureLayer','esri/tasks/support/Query'])
        .then(([FeatureLayer, Query]) => {
          this.view.map.layers.forEach(layer => {
            //let l = layer as esri.FeatureLayer;
            let l = layer;
            let query = new Query();
            query.where = "1=1";
            query.returnGeometry = true;
            query.outFields = '*';
            query.outSpatialReference = this.view.spatialReference;
            l.queryFeatures(query).then(results => {
              if (results.features.length > 0) {
                if (results.features[0].layer.title === 'Facilities - Facility Site Assets') {
                  this.sortByDistance(results.features, 'facilities');
                }
                if (results.features[0].layer.title === 'Parks - Park and Recreation Areas') {
                  this.sortByDistance(results.features, 'parks');
                }       
                if (results.features[0].layer.title === 'CaryTrails - Existing Greenway Trails') {
                  this.sortByDistance(results.features, 'greenways');
    
                }                                                             
              }
            })
          });
        });
        this.features.nearbySelected.unsubscribe();
      }
    })
  }
  sortByDistance(dataset, layer) {
    loadModules(["esri/geometry/geometryEngine"])
    .then(([geometryEngine]) => {
      dataset.forEach(feature => {
        
        feature.attributes.distance = parseFloat(geometryEngine.distance(feature.geometry, this.view.center, 'miles').toFixed(2));
      });
      dataset.sort((a,b) => {
        return a.attributes.distance - b.attributes.distance;
      });
      if (layer == 'facilities') {
        this.facilities = dataset;
        //this.features.setShops(dataset);
        this.features.setFacilities(dataset);          
      }
      if (layer == 'parks') {
        this.parks = dataset
        //this.features.setParking(dataset);
        this.features.setParks(dataset);          
      }
      if (layer == 'greenways') {
        this.greenways = dataset;
        //this.features.setTrailheads(dataset); 
        this.features.setGreenways(dataset); 
      }
    });
  }
  detectMapChange() {
    loadModules(["esri/geometry/geometryEngine"])
    .then(([geometryEngine]) => {
      this.view.watch('stationary', stationary => {
        if (stationary) {
          this.sortByDistance(this.facilities, 'facilities');  
          this.sortByDistance(this.parks, 'parks');
          this.sortByDistance(this.greenways, 'greenways');  
        }
      });
    });
  }
  loadBaseMapGallery() {
    loadModules([
      "esri/widgets/BasemapGallery",
      "esri/Basemap",
      "esri/widgets/BasemapGallery/support/LocalBasemapsSource"
      ])
      .then(([BasemapGallery, Basemap, LocalBasemapsSource]) => { 
        let basemapIds = ['streets-navigation-vector', 'hybrid','streets-night-vector', 'gray-vector', 'dark-gray-vector', 'topo-vector', 'streets-vector'];
        let source = new LocalBasemapsSource({basemaps:[]})
        basemapIds.forEach(id => {
          source.basemaps.push(Basemap.fromId(id));
        });

        this.basemapsGallery = new BasemapGallery({view:this.view, source:source});
      });
      this.features.basemapsEl.subscribe(el => {
        if (el && this.basemapsGallery) {
          this.basemapsEl = el;
          this.basemapsGallery.container = el.nativeElement;
        }
      });          
  }
  getExistingSymbol(layerTitle){
    const self = this
    for(var i = 0; i<this.view.map.layers.length; i ++){

    }
  }
  loadWidgets() {
    loadModules([
      "esri/widgets/Track",
      "esri/widgets/LayerList",
      "esri/widgets/Compass"
      ])
      .then(([Track, LayerList, Compass]) => {   
        this.loadBaseMapGallery(); 
        let track = new Track({view: this.view});
        this.view.ui.add(track, 'top-left');

        let compass = new Compass({view: this.view});
        this.view.ui.add(compass, 'top-left');
        this.layerList = new LayerList({
          view: this.view,
          listItemCreatedFunction: function (event) {
            const item = event.item;
            item.panel = {
              content: "legend",
              open: true,
              visible: false
            };
          }              
        });
 
        this.features.layerEl.subscribe(el => {
          if (el && this.layerList) {
            this.layerEl = el;
            this.layerList.container = el.nativeElement;
            window.setTimeout(()=> {
             let items = Array.from(el.nativeElement.getElementsByClassName('esri-layer-list-panel__content--legend'));
             items.forEach((item:HTMLElement) => {
              if (item.firstChild.textContent === 'legend') {
                item.removeChild(item.firstChild);
              }
             });
            }, 2000);
          }
        });
      });
  }
  ngOnInit() {
    if (this.platform.is('mobileweb')) {
      this.getGeo();
    } else {
      this.features.connected.subscribe(connected => {
        this.connected = connected;
        if (connected) {
          this.features.connected.unsubscribe();
          this.getGeo();
        }
      });      
    }
  }
}