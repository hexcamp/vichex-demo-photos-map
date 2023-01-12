import React, {useState} from 'react';
import {render} from 'react-dom';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {MapView} from '@deck.gl/core';
import {IconLayer} from '@deck.gl/layers';
import {H3HexagonLayer} from '@deck.gl/geo-layers';
import {schemeCategory10} from 'd3-scale-chromatic';
import {color as d3Color} from 'd3-color';
import { h3ToGeo } from 'h3-js';
import 'maplibre-gl/dist/maplibre-gl.css';

import IconClusterLayer from './icon-cluster-layer';

const dataSolid = [
  {
    "hex": "8228d7fffffffff",
    "count": 18.56737602222408,
    "colorIndex": 1
  }
]

const colors = schemeCategory10.map(colorName => {
  const { r, g, b } = d3Color(colorName).brighter()
  return [r, g, b]
})

const material = {
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [51, 51, 51]
}

// Source data CSV
const DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/icon/meteorites.json'; // eslint-disable-line

const MAP_VIEW = new MapView({repeat: true});
const INITIAL_VIEW_STATE = {
  longitude: -35,
  latitude: 36.7,
  zoom: 1.8,
  maxZoom: 20,
  pitch: 0,
  bearing: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

function renderTooltip(info) {
  const {object, x, y} = info;

  if (info.objects) {
    return (
      <div className="tooltip interactive" style={{left: x, top: y}}>
        {info.objects.map(({name, year, mass, class: meteorClass}) => {
          return (
            <div key={name}>
              <h5>{name}</h5>
              <div>Year: {year || 'unknown'}</div>
              <div>Class: {meteorClass}</div>
              <div>Mass: {mass}g</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (!object) {
    return null;
  }

  return object.cluster ? (
    <div className="tooltip" style={{left: x, top: y}}>
      {object.point_count} records
    </div>
  ) : (
    <div className="tooltip" style={{left: x, top: y}}>
      {object.name} {object.year ? `(${object.year})` : ''}
    </div>
  );
}

/* eslint-disable react/no-deprecated */
export default function App({
  data = DATA_URL,
  iconMapping = process.env.PUBLIC_URL + '/location-icon-mapping.json',
  iconAtlas = process.env.PUBLIC_URL + '/location-icon-atlas.png',
  showCluster = false,
  mapStyle = MAP_STYLE
}) {
  const [hoverInfo, setHoverInfo] = useState({});

  const hideTooltip = () => {
    setHoverInfo({});
  };
  const expandTooltip = info => {
    if (info.picked && showCluster) {
      setHoverInfo(info);
    } else {
      setHoverInfo({});
    }
  };

  const layerProps = {
    // data,
    // getPosition: d => d.coordinates,
    data: dataSolid,
    getPosition: d => {
      const latLng = h3ToGeo(d.hex)
      console.log('Jim1', d, latLng)
      // return latLng
      return [latLng[1], latLng[0]]
    },
    // pickable: true,
    iconAtlas,
    iconMapping,
    // onHover: !hoverInfo.objects && setHoverInfo
  };

  const layer = showCluster
    ? new IconClusterLayer({...layerProps, id: 'icon-cluster', sizeScale: 40})
    : new IconLayer({
        ...layerProps,
        id: 'icon',
        getIcon: d => 'marker',
        sizeUnits: 'meters',
        sizeScale: 2000,
        sizeMinPixels: 6
      });

  let selectedHex

  const hexLayer = new H3HexagonLayer({
    id: 'h3-hexagon-layer-solid',
    data: dataSolid,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    wireframe: false,
    filled: true,
    extruded: false,
    material,
    // elevationScale: zoom ? 5.0 + 30.0 * (10.0 / zoom) : 5,
    getHexagon: d => d.hex,
    // getFillColor: d => {
    getLineWidth: 3,
    getFillColor: d => {
      if (
        selectedHex &&
        selectedHex[0] === 'solid' &&
        d.hex === selectedHex[1]
      ) {
        return [255, 255, 255]
      } else {
        const color = colors[d.colorIndex]
        return [color[0], color[1], color[2], 100]
      }
    },
    getLineColor: d => {
      if (
        selectedHex &&
        selectedHex[0] === 'solid' &&
        d.hex === selectedHex[1]
      ) {
        return [255, 255, 255]
      } else {
        return colors[d.colorIndex]
      }
    },
    lineWidthMinPixels: 1,
    getElevation: d => {
      if (
        selectedHex &&
        selectedHex[0] === 'solid' &&
        d.hex === selectedHex[1]
      ) {
        return d.count * 1.5
      } else {
        return d.count
      }
    },
    updateTriggers: {
      getFillColor: [selectedHex],
      getElevation: [selectedHex]
    },
  })

  return (
    <DeckGL
      layers={[layer, hexLayer]}
      views={MAP_VIEW}
      initialViewState={INITIAL_VIEW_STATE}
      controller={{dragRotate: false}}
      // onViewStateChange={hideTooltip}
      // onClick={expandTooltip}
    >
      <Map mapLib={maplibregl} reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} />

    </DeckGL>
    // {renderTooltip(hoverInfo)}
  );
}

render(<App />, document.getElementById('root'))
