import { type Component } from 'solid-js'
import { SolidMap } from './components/solid-map'
import MapContent from './components/map-content'

const App: Component = () => {
  return (
    <SolidMap longitude={-118.4912} latitude={34.0119}>
      <MapContent />
    </SolidMap>
  )
}

export default App
