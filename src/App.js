import React from 'react'
import {
  createHashRouter,
  RouterProvider,
  Outlet,
  NavLink
} from 'react-router-dom'
import styled from 'styled-components'
// import MVTExample from './mvt/H3HexagonMVT'
import SimpleDeck from './SimpleDeck'
import MVTExample from './mvt/H3HexagonMVT'

const StyledList = styled.ul`
  display: flex;
`
const StyledItem = styled.li`
  display: block;
  margin: 0 0.5rem;
`

const router = createHashRouter([
  {
    path: '/',
    element: (
      <div>
        <nav>
          <StyledList>
            <StyledItem>
              <NavLink to='/'>Home</NavLink>
            </StyledItem>
            <StyledItem>
              <NavLink to='/edit'>Edit</NavLink>
            </StyledItem>
            <StyledItem>
              <NavLink to='/simple'>Simple</NavLink>
            </StyledItem>
          </StyledList>
        </nav>
        <>
          <Outlet />
        </>
      </div>
    ),
    children: [
      {
        path: '/',
        element: <MVTExample />
      },
      {
        path: 'edit',
        element: <MVTExample />
      },
      {
        path: 'simple',
        element: <SimpleDeck />
      }
    ]
  }
])

export default function App () {
  return <RouterProvider router={router} />
}
