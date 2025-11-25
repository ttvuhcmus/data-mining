import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

import L from 'leaflet'
import type { Map } from 'leaflet'

// Mảng emoji trái cây
const fruitEmojis = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑', '🍒', '🥝', '🍉', '🥭', '🍐', '🍋', '🥥', '🍍', '🫐']

interface Point {
  id: number
  lat: number
  lng: number
  emoji: string
}

// Hàm tạo custom icon với emoji
const createFruitIcon = (emoji: string) => {
  return L.divIcon({
    className: 'fruit-marker',
    html: `<div style="font-size: 32px; text-align: center; line-height: 1;">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

// Component to handle map events and expose map instance
function MapController({ 
  onZoomChange,
  onMapReady
}: { 
  onZoomChange: (zoom: number) => void
  onMapReady: (map: L.Map) => void
}) {
  const map = useMap()

  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])

  useEffect(() => {
    const updateZoom = () => {
      const currentZoom = map.getZoom()
      onZoomChange(currentZoom)
    }

    map.on('zoomend', updateZoom)
    map.on('moveend', updateZoom)

    return () => {
      map.off('zoomend', updateZoom)
      map.off('moveend', updateZoom)
    }
  }, [map, onZoomChange])

  return null
}

function App() {
  const [points, setPoints] = useState<Point[]>([])
  const [mapZoom, setMapZoom] = useState<number>(13)
  const [mapInstance, setMapInstance] = useState<Map | null>(null)

  // Generate random points within visible bounds
  const generateRandomPoints = () => {
    if (!mapInstance) return

    const bounds = mapInstance.getBounds() as LatLngBounds
    const north = bounds.getNorth()
    const south = bounds.getSouth()
    const east = bounds.getEast()
    const west = bounds.getWest()

    const newPoints: Point[] = []
    for (let i = 0; i < 10; i++) {
      const lat = south + Math.random() * (north - south)
      const lng = west + Math.random() * (east - west)
      // Chọn emoji ngẫu nhiên từ mảng
      const emoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)]
      newPoints.push({
        id: i + 1,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        emoji: emoji
      })
    }

    setPoints(newPoints)
  }

  // Check if zoom level is sufficient (zoom >= 10)
  const isZoomedIn = mapZoom >= 10

  return (
    <div className="app-container">
      <div className="map-wrapper">
        <MapContainer
          center={[10.762622, 106.660172]} // Ho Chi Minh City
          zoom={13}
          style={{ height: '100vh', width: '100vw' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            onZoomChange={setMapZoom}
            onMapReady={setMapInstance}
          />

          {points.map((point) => (
            <Marker 
              key={point.id} 
              position={[point.lat, point.lng]}
              icon={createFruitIcon(point.emoji)}
            >
              <Popup>
                <div>
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>{point.emoji}</span>
                  <strong>Điểm {point.id}</strong>
                  <br />
                  Latitude: {point.lat}
                  <br />
                  Longitude: {point.lng}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="map-controls">
          {isZoomedIn ? (
            <button 
              className="search-button"
              onClick={generateRandomPoints}
            >
              🔍 Tìm kiếm trong khu vực này
            </button>
          ) : (
            <div className="zoom-hint">
              Zoom vào để kích hoạt tìm kiếm (Zoom ≥ 10)
            </div>
          )}
        </div>
      </div>

      {points.length > 0 && (
        <div className="points-list">
          <h2>Danh sách {points.length} điểm đã tìm thấy:</h2>
          <div className="points-grid">
            {points.map((point) => (
              <div key={point.id} className="point-card">
                <h3>
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>{point.emoji}</span>
                  Điểm {point.id}
                </h3>
                <p><strong>Latitude:</strong> {point.lat}</p>
                <p><strong>Longitude:</strong> {point.lng}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
