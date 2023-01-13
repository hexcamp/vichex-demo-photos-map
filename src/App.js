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
        element: <SimpleDeck />
      },
      {
        path: 'edit',
        element: <SimpleDeck />
      }
    ]
  }
])

/*
export default function App () {
  return (
    <Router>
      <div>
        <nav>
          <StyledList>
            <StyledItem>
              <Link to='/'>Home</Link>
            </StyledItem>
            <StyledItem>
              <Link to='/edit'>Edit</Link>
            </StyledItem>
          </StyledList>
        </nav>
        <Switch>
          <Route path='/mvt'>
            <SimpleDeck />
          </Route>
          <Route path='/'>
            <SimpleDeck />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}
*/

export default function App () {
  return <RouterProvider router={router} />
}
