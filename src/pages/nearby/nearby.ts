import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { FeaturesProvider } from '../../providers/features/features';

import { loadModules } from 'esri-loader';
/**
 * Generated class for the NearbyPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-nearby',
  templateUrl: 'nearby.html',
})
export class NearbyPage implements OnInit {
  facilities:any[] = [];
  parks:any[] = [];
  greenways:any[] = [];
  list = 'facilities';
  constructor(public navCtrl: NavController, public navParams: NavParams, public features:FeaturesProvider) {
  }

  itemTapped(event, item, layertitle) {
    console.log('item: ' + JSON.stringify(item))
    console.log('layertitle: ' + layertitle)
    this.features.zoomto.next({"feature":item, "layertitle" : layertitle});
  }

  ngOnInit() {
    this.features.facilities.subscribe(features => {
      // features.forEach(feature => {
      //   let label:string = feature.attributes.LABEL;
      //   if (label.indexOf('(') > -1) {
      //     feature.attributes.LABEL = label.substring(0, label.indexOf('('));
      //   }
      // });
      this.facilities = features;
    })
    this.features.greenways.subscribe(features => {
      this.greenways = features;
    })
    this.features.parks.subscribe(features => {
      // features.forEach(feature => {
      //   let address:string = feature.attributes.ADDRESS;
      //   if (address.indexOf(', R') > -1) {

      //     feature.attributes.ADDRESS = address.substring(0, address.indexOf(', R')).replace('Approx. ', '');
      //   }
      // });
      this.parks = features;
    })      
  }

}
