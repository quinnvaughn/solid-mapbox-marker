import { SolidMap } from '../solid-map'

export type Place = {
  id: string
  title: string
  description: string
  coordinates: [number, number]
}

type Props = {
  place: Place
}

function PlacePopup(props: Place) {
  return (
    <div>
      <h3>{props.title} place popup</h3>
      <p>{props.description}</p>
    </div>
  )
}

export default function PlaceMarker(props: Props) {
  return (
    <SolidMap.Marker<Place>
      coordinates={props.place.coordinates}
      payload={props.place}
      renderPopup={(p) => <PlacePopup {...p} />}
    />
  )
}
