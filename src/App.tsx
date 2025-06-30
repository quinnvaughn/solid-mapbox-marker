import { type Component } from 'solid-js'
import { SolidMap } from './components/solid-map'
import { RoadHighlighter } from './components/road-highlighter'

const App: Component = () => {
  return (
    <SolidMap longitude={-118.4912} latitude={34.0119}>
      <SolidMap.Source
        type="raster-dem"
        id="dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        exaggeration={1.2}
      />
      <SolidMap.Layer
        id="sky"
        type="sky"
        paint={{ 'sky-type': 'atmosphere' }}
      />
      <SolidMap.Layer
        id="3d-buildings"
        source="composite"
        source-layer="building"
        type="fill-extrusion"
        filter={['==', ['get', 'extrude'], 'true']}
        paint={{
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6,
        }}
      />
      <RoadHighlighter />
    </SolidMap>
  )
}

export default App
