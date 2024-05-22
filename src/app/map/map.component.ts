import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { FeatureCollection, GeoJson } from '../map';
import { BehaviorSubject } from 'rxjs';
import * as mapbox from 'mapbox-gl';

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

  source: any;
  sourcePoligon: any;
  sourcePolMark: any;
  polygonCoordinates = [];

  featers = new BehaviorSubject<any[]>([]);
  poligons = new BehaviorSubject<any[]>([]);
  poligonMarkets = new BehaviorSubject<any[]>([]);

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
    this.buildMap();
  }

  updatePolygon() {
    this.featers.next([]);
    this.cdr.detectChanges();
  }

  updateMarkets() {
    this.poligons.next([]);
    this.poligonMarkets.next([]);
    this.cdr.detectChanges();
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
      const coordinates = [e.lngLat.lng, e.lngLat.lat];
      const newMarker = new GeoJson(coordinates, {
        message: this.message,
        id: Date.now(),
      });
      const newMarkerPoligon = new GeoJson(coordinates, {
        // messagePoligon: this.messagePoligon,
        id: Date.now(),
      });
      const newMarkerPointPoligon = new GeoJson(coordinates, {
        messagePoligon: this.messagePoligon,
        id: Date.now(),
      });

      if (newMarkerPointPoligon.properties.messagePoligon) {
        this.poligonMarkets.next([
          ...this.poligonMarkets.value,
          newMarkerPointPoligon,
        ]);
      }

      if (this.messagePoligon) {
        this.poligons.next([
          ...this.poligons.value,
          newMarkerPoligon.geometry.coordinates,
        ]);
      }

      if (newMarker.properties.message) {
        this.featers.next([...this.featers.value, newMarker]);
      }
      console.log(newMarkerPointPoligon);
      console.log(this.poligons);

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
            coordinates: [],
          },
        },
      });
      this.sourcePoligon = this.map?.getSource(
        'Polygon Hex'
      ) as mapboxgl.GeoJSONSource;

      this.poligons.subscribe((point) => {
        let data = {
          type: 'Feature',
          properties: [],
          geometry: {
            type: 'Polygon',
            coordinates: [point],
          },
        };

        if (this.sourcePoligon) {
          this.sourcePoligon.setData(data);
        }
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

      this.map?.addSource('MarketsP', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.sourcePolMark = this.map?.getSource('MarketsP');
      this.poligonMarkets.subscribe((point) => {
        let data = new FeatureCollection(point);
        console.log(data);

        this.sourcePolMark.setData(data);
      });

      this.map?.addLayer({
        id: 'MarketsP',
        type: 'symbol',
        source: 'MarketsP',
        layout: {
          'icon-image': 'ship',
          'text-field': '{messagePoligon}',
          'text-size': 24,
          'text-transform': 'uppercase',
          'text-offset': [0, 1],
        },
        paint: {
          'text-color': 'black',
          'text-halo-color': '#fff',
          'text-halo-width': 2,
        },
      });
      this.map?.addLayer({
        id: 'MarketsP Circle',
        type: 'circle',
        source: 'MarketsP',
        paint: {
          'circle-radius': 5,
          'circle-color': 'red',
        },
      });

      this.map?.addSource('Markets', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.source = this.map?.getSource('Markets');
      this.featers.subscribe((featers) => {
        let data = new FeatureCollection(featers);
        this.source.setData(data);
      });

      this.map?.addLayer({
        id: 'Markets',
        type: 'symbol',
        source: 'Markets',
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
        id: 'Markets Circle',
        type: 'circle',
        source: 'Markets',
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

// this.map.on('load', () => {
//   this.map?.addSource('maine', {
//     type: 'geojson',
//     data: {
//       type: 'Feature',
//       geometry: {
//         type: 'Polygon',
//         coordinates: [
//           [
//             [39.69718157508311, 47.24234475287463],
//             [39.709202071469065, 47.23762404391215],
//             [39.690850504138155, 47.230360998517654],
//           ],
//         ],
//       },
//       properties: {},
//     },
//   });

//   this.map?.addLayer({
//     id: 'maine',
//     type: 'fill',
//     source: 'maine', // reference the data source
//     layout: {},
//     paint: {
//       'fill-color': '#0080ff', // blue color fill
//       'fill-opacity': 0.5,
//     },
//   });
// Add a black outline around the polygon.
// this.map?.addLayer({
//   id: 'outline',
//   type: 'line',
//   source: 'maine',
//   layout: {},
//   paint: {
//     'line-color': '#000',
//     'line-width': 3,
//   },
// });

// this.map?.addLayer({
//   id: 'Polygon Hex',
//   type: 'circle',
//   source: 'Polygon Hex',
//   layout: {},
//   paint: {
//     'circle-color': 'blue',
//     'circle-radius': 6,
//     'circle-stroke-width': 2,
//     'circle-stroke-color': 'white',
//   },
// });
//});
