import type { Component } from 'solid-js'
import { Asciifier } from 'src'
import aapelix from './aapelix.png'
import rick from './Rick Astley - Never Gonna Give You Up (Official Music Video).mp4'

const App: Component = () => {
  return (
    <div>
      <Asciifier src={aapelix} transparentBg />
      <Asciifier src={rick} transparentBg />
    </div>
  )
}

export default App
