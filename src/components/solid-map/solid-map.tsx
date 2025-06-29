import mapboxgl from 'mapbox-gl'
import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  Show,
  useContext,
} from 'solid-js'
import { render as solidRender } from 'solid-js/web'
import { JSX } from 'solid-js/jsx-runtime'
import { match } from 'ts-pattern'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

const MapboxContext = createContext<mapboxgl.Map>()

type Props = {
  longitude: number
  latitude: number
  zoom?: number
  children?: JSX.Element | JSX.Element[]
}

export function useMapboxContext() {
  const context = useContext(MapboxContext)
  if (!context) {
    throw new Error('useMapboxContext must be used within a MapboxProvider')
  }
  return context
}

export default function SolidMap(props: Props) {
  let container: HTMLDivElement | undefined
  const [map, setMap] = createSignal<mapboxgl.Map>()

  onMount(() => {
    if (!container) return
    const mb = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/standard',
      center: [props.longitude, props.latitude],
      zoom: props.zoom || 10,
      pitch: 60,
      bearing: -20,
    })
    mb.addControl(new mapboxgl.NavigationControl())
    setMap(mb)
    onCleanup(() => {
      if (mb) {
        mb.remove()
      }
    })
  })

  return (
    <>
      <div ref={container} style={{ width: '100%', height: '100%' }} />
      <Show when={map()}>
        {(map) => (
          <MapboxContext.Provider value={map()}>
            {props.children}
          </MapboxContext.Provider>
        )}
      </Show>
    </>
  )
}

type GeoJSONSourceProps = {
  id: string
  type: 'geojson'
  data: GeoJSON.FeatureCollection<any>
}

type VectorSourceProps = {
  id: string
  type: 'vector'
  url: string
}

type SourceProps = GeoJSONSourceProps | VectorSourceProps

SolidMap.Source = function Source(props: SourceProps) {
  const map = useMapboxContext()

  onMount(() => {
    match(props)
      .with({ type: 'geojson' }, (props) => {
        map.addSource(props.id, {
          ...props,
        })
      })
      .with({ type: 'vector' }, (props) => {
        map.addSource(props.id, {
          ...props,
        })
      })
      .exhaustive()

    onCleanup(() => {
      if (map.getSource(props.id)) {
        map.removeSource(props.id)
      }
    })
  })
  return null
}

type MarkerProps<T> = {
  coordinates: [number, number]
  payload?: T
  renderElement?: (payload?: T) => HTMLElement
  renderPopup?: (payload: T) => JSX.Element
  onClick?: (payload?: T) => void
}

SolidMap.Marker = function Marker<T>(props: MarkerProps<T>) {
  let marker: mapboxgl.Marker
  const map = useMapboxContext()

  onMount(() => {
    const options: mapboxgl.MarkerOptions = {}
    if (props.renderElement && props.payload !== undefined) {
      options.element = props.renderElement(props.payload)
    }
    marker = new mapboxgl.Marker(options)
      .setLngLat(props.coordinates)
      .addTo(map)

    const el = marker.getElement()

    el.addEventListener('click', (e) => {
      e.stopPropagation()

      marker.togglePopup()

      if (props.onClick && props.payload !== undefined) {
        props.onClick(props.payload)
      }
    })

    if (props.renderPopup && props.payload !== undefined) {
      const container = document.createElement('div')
      const popupContent = props.renderPopup(props.payload)
      solidRender(() => popupContent, container)
      marker.setPopup(new mapboxgl.Popup().setDOMContent(container))
    }
  })

  onCleanup(() => marker.remove())

  return null
}
