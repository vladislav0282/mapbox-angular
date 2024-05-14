import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { FeatureCollection, GeoJson } from '../map';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  map: mapboxgl.Map | undefined;
  style = 'mapbox://styles/mapbox/streets-v11';
  lat: number = 55.751244;
  lng: number = 37.618423;
  message: string = '';
  messagePoligon: string = '';

  markers: any;
  source: any;
  sourcePoligon: any;
  polygonCoordinates: number[][] = [];

  featers = new BehaviorSubject<any[]>([]);
  points = new BehaviorSubject<any[]>([]);
  constructor(private cdr: ChangeDetectorRef) {
    (mapbox as typeof mapbox).accessToken =
      'pk.eyJ1IjoibWFyb29uZWRpb25lIiwiYSI6ImNqdmp0MzB1azBpcDAzem1naHZwMjNndGIifQ.65nvvRg9QeFUV2c6b9W4Vw';
  }

  ngOnInit() {
    this.initializeMap();
  }

  private initializeMap() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        this.map?.flyTo({
          center: [this.lng, this.lat],
        });
      });
    }
    this.polygonCoordinates = [[this.lng, this.lat]];
    this.buildMap();
  }

  buildMap() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: this.style,
      zoom: 13,
      center: [this.lng, this.lat],
    });

    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.on('click', (e: any) => {
      console.log(e);
      const coordinates = [e.lngLat.lng, e.lngLat.lat];
      const newMarker = new GeoJson(coordinates, {
        message: this.message,
        id: Date.now(),
      });
      const newMarkerPoligon = new GeoJson(coordinates, {
        messagePoligon: this.messagePoligon,
        id: Date.now(),
      });

      if (newMarkerPoligon.properties.messagePoligon) {
        this.points.next([...this.points.value, newMarkerPoligon]);

        this.polygonCoordinates.push(coordinates);
      }
      if (newMarker.properties.message) {
        this.featers.next([...this.featers.value, newMarker]);
      }
      this.message = '';
      this.messagePoligon = '';
    });

    this.map.on('load', (event: any) => {
      this.map?.addSource('Polygon Hex', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: [],
          geometry: {
            type: 'Polygon',
            coordinates: [this.polygonCoordinates],
          },
        },
      });

      this.sourcePoligon = this.map?.getSource('Polygon Hex');
      this.points.subscribe((point) => {
        let data = new FeatureCollection(point);
        this.sourcePoligon.setData(data);
      });

      this.map?.addLayer({
        id: 'Polygon Hex',
        type: 'circle',
        source: 'Polygon Hex',
        layout: {},
        paint: {
          'circle-color': 'blue',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'white',
        },
      });

      this.map?.addLayer({
        id: 'Polygon Hex',
        type: 'fill',
        source: 'Polygon Hex',
        layout: {},
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5,
        },
      });

      this.map?.addSource('Austin Points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.source = this.map?.getSource('Austin Points');
      this.featers.subscribe((featers) => {
        let data = new FeatureCollection(featers);
        this.source.setData(data);
      });

      this.map?.addLayer({
        id: 'Austin Points',
        type: 'symbol',
        source: 'Austin Points',
        layout: {
          'icon-image': 'ship',
          'text-field': '{message}',
          'text-size': 24,
          'text-transform': 'uppercase',
          'text-offset': [0, 1.5],
        },
        paint: {
          'text-color': 'black',
          'text-halo-color': '#fff',
          'text-halo-width': 2,
        },
      });
      this.map?.addLayer({
        id: 'Austin Points Circle',
        type: 'circle',
        source: 'Austin Points',
        paint: {
          'circle-radius': 5,
          'circle-color': 'red',
        },
      });
    });
  }

  removeMarker(id: any) {
    this.featers.next(
      this.featers.value.filter((feater: any) => feater.properties.id !== id)
    );
    this.message = '';
  }

  editMarker(marker: GeoJson) {
    if (this.message) {
      marker.properties.message = this.message;
      this.source.setData(new FeatureCollection(this.featers.value));
      this.map?.getSource('Austin Points');
    }
    this.message = '';
  }

  flyTo(data: GeoJson) {
    this.map?.flyTo({
      center: [data.geometry.coordinates[0], data.geometry.coordinates[1]],
    });
  }
}
