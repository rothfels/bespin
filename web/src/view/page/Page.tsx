import * as React from 'react'
import { NavBar } from '../nav/NavBar'

export const Page: React.FC<JSX.IntrinsicElements['div']> = props => (
  <div className="mw8">
    <NavBar />
    {props.children}
  </div>
)
