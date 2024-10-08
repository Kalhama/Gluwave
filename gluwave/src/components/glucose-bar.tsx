import React from 'react'

import { GlucoseStatus } from './glucose-status'
import { MenuBar } from './menu-bar'

export const GlucoseBar = () => {
  return (
    <MenuBar>
      <div className="h-6 w-6" />
      <GlucoseStatus />
    </MenuBar>
  )
}
