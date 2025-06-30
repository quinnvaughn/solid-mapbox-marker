import { onMount } from 'solid-js'
import { useMapboxContext } from '../solid-map/solid-map'

export default function RoadHighlighter() {
  const map = useMapboxContext()

  onMount(() => {
    map.on('load', () => {
      map.addSource('dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
      })
      map.setTerrain({ source: 'dem', exaggeration: 1.2 })

      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: { 'sky-type': 'atmosphere' },
      })

      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', ['get', 'extrude'], 'true'],
        type: 'fill-extrusion',
        // minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6,
        },
      })

      map.addLayer(
        {
          id: 'highlighted-road',
          type: 'line',
          source: 'composite',
          'source-layer': 'road',
          paint: {
            'line-color': '#ff0000',
            'line-width': [
              'interpolate',
              ['exponential', 1.5],
              ['zoom'],
              12,
              2,
              16,
              6,
            ],
          },
          filter: ['==', ['id'], ''],
        },
        'road-label'
      )
      map.on('click', (e) => {
        const hits = map.queryRenderedFeatures(e.point)
        const roads = hits.filter(
          (f) =>
            f.layer?.source === 'composite' &&
            f.layer['source-layer'] === 'road'
        )
        console.log('Roads:', roads)
        if (!roads.length) return
        const roadId = roads[0].id
        map.setFilter('highlighted-road', ['==', ['id'], roadId])
      })
    })
  })

  return null
}
