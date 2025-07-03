import mapboxgl, {
  LayerSpecification,
  MapMouseEventType,
  MapMouseEvent,
} from 'mapbox-gl'
import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  Show,
  splitProps,
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
      // style: 'mapbox://styles/mapbox/standard',
      style: 'mapbox://styles/mapbox/streets-v11',
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

type RasterDemSourceProps = {
  id: string
  type: 'raster-dem'
  url: string
  tileSize?: number
  maxzoom?: number
  exaggeration?: number
}

type SourceProps = GeoJSONSourceProps | VectorSourceProps | RasterDemSourceProps

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
      .with({ type: 'raster-dem' }, (props) => {
        const addDem = () => {
          map.addSource(props.id, {
            type: 'raster-dem',
            url: props.url,
            tileSize: props.tileSize || 512,
            maxzoom: props.maxzoom || 14,
          })
          map.setTerrain({
            source: props.id,
            exaggeration: props.exaggeration || 1.0,
          })
        }
        if (map.isStyleLoaded()) {
          addDem()
        } else {
          map.once('style.load', addDem)
        }
      })
      .exhaustive()

    onCleanup(() => {
      function doRemoveLayer() {
        if (map.getLayer(props.id)) {
          map.removeLayer(props.id)
        }
      }

      // mirror the mount logic so we don’t try to remove before style loads
      if (map.isStyleLoaded()) {
        doRemoveLayer()
      } else {
        map.once('load', doRemoveLayer)
      }
    })
  })
  return null
}

type LayerProps = LayerSpecification & {
  before?: string
}

SolidMap.Layer = function Layer(props: LayerProps) {
  const map = useMapboxContext()
  const [beforeProps, layerSpec] = splitProps(props, ['before'])

  onMount(() => {
    function doAddLayer() {
      if (map.getLayer(props.id)) {
        console.warn(`Layer with id ${props.id} already exists`)
        return
      }
      map.addLayer(layerSpec, beforeProps.before)
    }
    if (map.isStyleLoaded()) {
      doAddLayer()
    } else {
      map.once('style.load', doAddLayer)
    }
  })

  onCleanup(() => {
    if (map.getLayer(props.id)) {
      map.removeLayer(props.id)
    }
  })

  return null
}

type EventProps = {
  event: MapMouseEventType
  layer?: string
  handler: (e: MapMouseEvent) => void
  once?: boolean
}

SolidMap.Event = function Event(props: EventProps) {
  const map = useMapboxContext()
  let unbind: (() => void) | null = null

  onMount(() => {
    const method = props.once ? map.once.bind(map) : map.on.bind(map)
    const bind = () => {
      if (props.layer) {
        method(props.event, props.layer, props.handler)
      } else {
        method(props.event, props.handler)
      }

      unbind = () => {
        if (props.layer) {
          map.off(props.event, props.layer, props.handler)
        } else {
          map.off(props.event, props.handler)
        }
      }
    }

    if (props.layer) {
      const waitForLayer = () => {
        if (map.getLayer(props.layer!)) {
          bind()
        } else {
          map.once('styledata', waitForLayer)
        }
      }
      waitForLayer()
    } else {
      bind()
    }
  })

  onCleanup(() => {
    unbind?.()
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

type OnLoadProps = {
  once?: boolean
  handler: () => void
}

SolidMap.OnLoad = function OnLoad(props: OnLoadProps) {
  const map = useMapboxContext()

  onMount(() => {
    const method = props.once ? map.once.bind(map) : map.on.bind(map)
    method('load', props.handler)
  })

  onCleanup(() => {
    map.off('load', props.handler)
  })

  return null
}

type ClickProps = {
  layer?: string
  handler: (e: MapMouseEvent) => void
}

SolidMap.Click = function Click(props: ClickProps) {
  const map = useMapboxContext()

  onMount(() => {
    if (props.layer) {
      map.on('click', props.layer, props.handler)
    } else {
      map.on('click', props.handler)
    }
  })

  onCleanup(() => {
    if (props.layer) {
      map.off('click', props.layer, props.handler)
    } else {
      map.off('click', props.handler)
    }
  })

  return null
}
