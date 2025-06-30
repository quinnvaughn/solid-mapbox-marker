import SolidMap, { useMapboxContext } from '../solid-map/solid-map'

export default function RoadHighlighter() {
  const map = useMapboxContext()
  return (
    <>
      <SolidMap.Event
        event="click"
        handler={(e) => {
          const hits = map.queryRenderedFeatures(e.point)
          const roads = hits.filter(
            (f) =>
              f.layer?.source === 'composite' &&
              f.layer['source-layer'] === 'road'
          )
          if (!roads.length) return
          const roadId = roads[0].id
          map.setFilter('highlighted-road', ['==', ['id'], roadId])
        }}
      />
      <SolidMap.Layer
        id="highlighted-road"
        type="line"
        source="composite"
        source-layer="road"
        paint={{
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
        }}
        filter={['==', ['id'], '']}
        before="road-label"
      />
    </>
  )
}
