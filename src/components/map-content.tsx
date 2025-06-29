import { createSignal, onMount, For, Show } from 'solid-js'
import { PlaceMarker } from './place-marker'
import { Place } from './place-marker/place-marker'
import { useMapboxContext } from './solid-map/solid-map'

export default function MapContent() {
  const [places, setPlaces] = createSignal<Place[]>([])
  const [formIsOpen, setFormIsOpen] = createSignal(false)
  const [coordinates, setCoordinates] = createSignal<[number, number]>([0, 0])
  const map = useMapboxContext()

  onMount(() => {
    map.on('click', (e) => {
      setFormIsOpen((prev) => !prev)
      setCoordinates(e.lngLat.toArray() as [number, number])
    })
  })

  return (
    <>
      <For each={places()}>{(p) => <PlaceMarker place={p} />}</For>
      <Show when={formIsOpen()}>
        <form
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'white',
            padding: '10px',
            'border-radius': '5px',
            'box-shadow': '0 2px 8px rgba(0,0,0,0.1)',
          }}
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const title = formData.get('title') as string
            const description = formData.get('description') as string

            setPlaces((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                title,
                description,
                coordinates: coordinates(),
              },
            ])
            setCoordinates([0, 0])
            setFormIsOpen(false)
          }}
        >
          <label>
            Title:
            <input type="text" name="title" required />
          </label>
          <label>
            Description:
            <textarea name="description" required></textarea>
          </label>
          <button type="submit">Add Place</button>
          <button type="button" onClick={() => setFormIsOpen(false)}>
            Cancel
          </button>
        </form>
      </Show>
    </>
  )
}
