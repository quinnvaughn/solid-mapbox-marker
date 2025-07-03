import { createSignal } from 'solid-js'
import SolidMap, { useMapboxContext } from '../solid-map/solid-map'

export default function RoadHighlighter() {
  const map = useMapboxContext()
  const [layerIds, setLayerIds] = createSignal<string[]>([])

  return (
    <>
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
      <SolidMap.OnLoad
        once
        handler={() => {
          const ids = map
            .getStyle()
            .layers!.filter(
              (l) =>
                l.source === 'composite' &&
                (l as any)['source-layer'] === 'road'
            )
            .map((l) => l.id)
          setLayerIds(ids)
        }}
      />
      <SolidMap.Click
        handler={(e) => {
          const hits = map.queryRenderedFeatures(e.point, {
            layers: layerIds(),
          })
          if (!hits.length) return
          const clickedName = hits[0].properties?.name as string
          if (!clickedName) return

          map.setFilter('highlighted-road', [
            '==',
            ['get', 'name'],
            clickedName,
          ])
        }}
      />
    </>
  )
}
