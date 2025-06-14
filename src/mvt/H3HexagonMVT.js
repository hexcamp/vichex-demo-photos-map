import { useState, useEffect, useMemo } from 'react'
import { FlyToInterpolator } from '@deck.gl/core'
import { latLngToCell } from 'h3-js'
import produce from 'immer'
import { useLocation } from 'react-router-dom'
import hexToUrl from './hex-to-url'
import locations from './locations'
import H3HexagonView from './h3-hexagon-view'
import ResolutionSelect from './resolution-select'
import LocationPicker from './location-picker'

// var array = new Uint8Array(64); crypto.getRandomValues(array)
// Array.from(array).map(b => b.toString(16).padStart(2, "0")).join('')

export default function H3HexagonMVT ({ homeLinkCounter }) {
  const [resolution, setResolution] = useState(13)
  const [dataSolid, setDataSolid] = useState([])
  const [dataIndex, setDataIndex] = useState(new Map())
  const [nextColor, setNextColor] = useState(0)
  const location = useLocation()
  const [initialViewState, setInitialViewState] = useState({
    ...locations.yyj,
    maxZoom: 20,
    minZoom: 1
  })
  const [viewState, setViewState] = useState({})
  const [selectedHex, setSelectedHex] = useState()
  const selectedHexBase32 = useMemo(
    () => (selectedHex ? hexToUrl(selectedHex[1]) : ''),
    [selectedHex]
  )

  useEffect(() => {
    const key = location.search.replace('?loc=', '')
    if (locations[key]) {
      const initialViewState = {
        ...locations[key],
        transitionInterpolator: new FlyToInterpolator({
          speed: 1.5
        }),
        transitionDuration: 'auto',
        maxZoom: 20,
        minZoom: 1
      }
      setInitialViewState(initialViewState)
    }
  }, [location])

  useEffect(() => {
    const initialViewState = {
      ...locations.yyj,
      transitionInterpolator: new FlyToInterpolator({
        speed: 1.5
      }),
      transitionDuration: 'auto',
      maxZoom: 20,
      minZoom: 1
    }
    setInitialViewState(initialViewState)
  }, [homeLinkCounter])

  useEffect(() => {
    async function fetchData () {
      const response = await fetch(process.env.PUBLIC_URL + '/data.json')
      const data = await response.json()
      setDataSolid(data.solid)
      setViewState(data.viewState)
      updateDataIndex(data.solid)
    }
    fetchData()
  }, [setDataSolid, setViewState])

  function updateDataIndex (data) {
    const dataIndex = new Map()
    for (const d of data) {
      dataIndex.set(d.hex, d)
    }
    setDataIndex(dataIndex)
  }

  function pushLatLng (lat, lng) {
    if (location.pathname !== '/edit') return
    const hex = latLngToCell(lat, lng, resolution)
    const colorIndex = nextColor % 10
    const newDataPoint = {
      hex,
      // count: 30 * (9.682 - Math.log((resolution + 1) * 1000)),
      count:
        1000 * (1 / Math.log((resolution + 2) * (resolution + 2)) / 10) - 17.5,
      colorIndex,
      type: 'No type',
      label: 'Unlabeled'
    }
    setNextColor(colorIndex + 1)
    const nextData = produce(dataSolid, draft => {
      draft.push(newDataPoint)
    })
    setDataSolid(nextData)
    updateDataIndex(nextData)
  }

  function pickHex (layer, hex) {
    setSelectedHex([layer, hex])
  }

  function removeHex (layer, hexToRemove) {
    const nextData = produce(dataSolid, draft => {
      draft.splice(
        0,
        draft.length,
        ...draft.filter(({ hex }) => hex !== hexToRemove)
      )
    })
    setDataSolid(nextData)
    updateDataIndex(nextData)
  }

  return (
    <div>
      {location.pathname === '/edit' && (
        <div style={{ display: 'flex' }}>
          <ResolutionSelect
            resolution={resolution}
            setResolution={setResolution}
          />
          <LocationPicker flatten={flatten} />
        </div>
      )}
      <div style={{ display: 'flex' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '70vh',
            background: '#64828c'
          }}
        >
          <H3HexagonView
            dataSolid={dataSolid}
            initialViewState={initialViewState}
            setInitialViewState={setInitialViewState}
            pushLatLng={pushLatLng}
            pickHex={pickHex}
            setViewState={setViewState}
            selectedHex={selectedHex}
            setSelectedHex={setSelectedHex}
          />
        </div>
        {location.pathname === '/edit' && (
          <div style={{ width: '100%' }}>
            <h3>Selected</h3>
            {selectedHex && (
              <>
                <div>Type: {dataIndex.get(selectedHex[1]).type}</div>
                <div>Label: {dataIndex.get(selectedHex[1]).label}</div>
                <div>
                  Hex: {selectedHex[1]} {selectedHex[0]}
                </div>
                <div>Base32: {selectedHexBase32}</div>
                <div>
                  Hex.Camp URL:{' '}
                  <a href={`https://${selectedHexBase32}.vichex.ca`}>
                    {selectedHexBase32}.vichex.ca
                  </a>
                </div>
                <div>
                  <button
                    onClick={() => {
                      removeHex(selectedHex[0], selectedHex[1])
                      setSelectedHex(null)
                    }}
                  >
                    Delete
                  </button>
                  <button onClick={() => setSelectedHex(null)}>Deselect</button>
                </div>
              </>
            )}
            <h3>Data</h3>
            <details>
              <pre>
                {JSON.stringify(
                  {
                    viewState,
                    solid: dataSolid
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        )}
      </div>
      {location.pathname === '/' && (
        <div style={{ padding: '0.5rem' }}>
          {selectedHex ? (
            <>
              {dataIndex.get(selectedHex[1]).type}:
              <a href={`https://${selectedHexBase32}.vichex.ca`}>
                {dataIndex.get(selectedHex[1]).label}
              </a>
            </>
          ) : (
            <span>No hexagon selected.</span>
          )}
        </div>
      )}
    </div>
  )

  function flatten (event) {
    const initialViewState = {
      ...viewState,
      pitch: 0,
      bearing: 0,
      transitionInterpolator: new FlyToInterpolator(),
      transitionDuration: 1000
    }
    setInitialViewState(initialViewState)
    event.preventDefault()
  }
}
