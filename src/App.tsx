import { type Component } from 'solid-js'
import { SolidMap } from './components/solid-map'
import { RoadHighlighter } from './components/road-highlighter'

const App: Component = () => {
  return (
    <SolidMap longitude={-118.4912} latitude={34.0119}>
      <RoadHighlighter />
    </SolidMap>
  )
}

export default App
