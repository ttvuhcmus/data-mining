import { useState } from 'react'
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

import L from 'leaflet'
import type { Map } from 'leaflet'

import type { Point, DrawnRectangle } from './types/nasa'
import type { AppMode } from './types/app'
import { useNasaData } from './hooks/useNasaData'
import { fetchWeatherData } from './utils/nasaApi'
import { fruitEmojis } from './utils/constants'
import { MapController } from './components/MapController'
import { MapControls } from './components/MapControls'
import { PointMarker } from './components/PointMarker'
import { AreaMarker } from './components/AreaMarker'
import { PointManagementPanel } from './components/PointManagementPanel'
import { AreaManagementPanel } from './components/AreaManagementPanel'

function App() {
  const [points, setPoints] = useState<Point[]>([])
  const [, setMapZoom] = useState<number>(13)
  const [, setMapInstance] = useState<Map | null>(null)
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState<boolean>(false)
  const [isAreaManagementPanelOpen, setIsAreaManagementPanelOpen] = useState<boolean>(false)
  const [mode, setMode] = useState<AppMode>('view') // 'view' hoặc 'edit'
  const [drawStartPoint, setDrawStartPoint] = useState<L.LatLng | null>(null)
  const [, setDrawEndPoint] = useState<L.LatLng | null>(null)
  const [drawBounds, setDrawBounds] = useState<L.LatLngBounds | null>(null)
  const [drawnRectangles, setDrawnRectangles] = useState<DrawnRectangle[]>([])
  const [areaPoints, setAreaPoints] = useState<Point[]>([]) // Điểm từ quét khu vực (tách biệt với điểm click) - dùng để lưu dữ liệu

  // Sử dụng hook để xử lý dữ liệu NASA
  useNasaData()

  // Hàm random điểm trong khu vực và gọi API thời tiết
  const generatePointsInArea = async (bounds: L.LatLngBounds, areaId: number) => {
    const north = bounds.getNorth()
    const south = bounds.getSouth()
    const east = bounds.getEast()
    const west = bounds.getWest()
    
    // Random 10 điểm trong khu vực
    const newAreaPoints: Point[] = []
    for (let i = 0; i < 10; i++) {
      const lat = south + Math.random() * (north - south)
      const lng = west + Math.random() * (east - west)
      // Chọn emoji ngẫu nhiên từ mảng
      const emoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)]
      
      const maxClickId = points.length > 0 ? Math.max(...points.map(p => p.id)) : 0
      const maxAreaId = areaPoints.length > 0 ? Math.max(...areaPoints.map(p => p.id)) : 0
      const newId = Math.max(maxClickId, maxAreaId) + 1 + i
      
      newAreaPoints.push({
        id: newId,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        emoji: emoji,
        isLoading: true,
        source: 'area',
        areaId: areaId
      })
    }
    
    // Lưu các điểm vào areaPoints (để lưu dữ liệu)
    setAreaPoints(prev => [...prev, ...newAreaPoints])
    
    // Gọi API thời tiết cho từng điểm
    const pointsWithData = await Promise.all(
      newAreaPoints.map(async (point) => {
        const weather = await fetchWeatherData(point.lat, point.lng)
        
        // Console.log object thời tiết
        if (weather) {
          console.log(`Điểm ${point.id} (${point.emoji}) [Khu vực ${areaId}] - Tọa độ: [${point.lat}, ${point.lng}] - Thời tiết:`, weather)
        } else {
          console.warn(`Điểm ${point.id} (${point.emoji}) [Khu vực ${areaId}] - Tọa độ: [${point.lat}, ${point.lng}] - Không lấy được dữ liệu thời tiết`)
        }
        
        return {
          ...point,
          weather,
          isLoading: false
        }
      })
    )
    
    // Cập nhật điểm với dữ liệu thời tiết
    setAreaPoints(prev => 
      prev.map(point => {
        const updated = pointsWithData.find(p => p.id === point.id)
        return updated || point
      })
    )
    
    // Chọn emoji ngẫu nhiên cho khu vực
    const areaEmoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)]
    
    // Cập nhật trạng thái khu vực: tắt loading và set emoji
    setDrawnRectangles(prev =>
      prev.map(rect =>
        rect.id === areaId
          ? { ...rect, isLoading: false, emoji: areaEmoji }
          : rect
      )
    )
  }

  // Hàm xử lý khi bắt đầu vẽ
  const handleDrawStart = (lat: number, lng: number) => {
    setDrawStartPoint(L.latLng(lat, lng))
    setDrawEndPoint(null)
    setDrawBounds(null)
  }

  // Hàm xử lý khi di chuyển chuột trong lúc vẽ
  const handleDrawMove = (lat: number, lng: number) => {
    if (drawStartPoint) {
      setDrawEndPoint(L.latLng(lat, lng))
      setDrawBounds(L.latLngBounds([drawStartPoint, L.latLng(lat, lng)]))
    }
  }

  // Hàm xử lý khi kết thúc vẽ
  const handleDrawEnd = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    // Chỉ xử lý trong mode edit
    if (mode !== 'edit') {
      setDrawStartPoint(null)
      setDrawEndPoint(null)
      setDrawBounds(null)
      return
    }
    
    // Phân biệt click và quét: nếu start và end giống nhau (hoặc rất gần) thì là click
    // So sánh cả lat và lng
    const isClick = Math.abs(startLat - endLat) < 0.0001 && Math.abs(startLng - endLng) < 0.0001
    
    if (isClick) {
      // Nếu chỉ click (không kéo), xử lý như điểm click thông thường
      await handleMapClick(startLat, startLng)
      
      // Reset để có thể tiếp tục
      setDrawStartPoint(null)
      setDrawEndPoint(null)
      setDrawBounds(null)
      return
    }

    console.log('=== QUÉT KHU VỰC ===')
    console.log('Điểm đầu (Start Point):', {
      latitude: startLat,
      longitude: startLng,
      formatted: `[${startLat.toFixed(6)}, ${startLng.toFixed(6)}]`
    })
    console.log('Điểm cuối (End Point):', {
      latitude: endLat,
      longitude: endLng,
      formatted: `[${endLat.toFixed(6)}, ${endLng.toFixed(6)}]`
    })
    console.log('Bounds:', {
      north: Math.max(startLat, endLat),
      south: Math.min(startLat, endLat),
      east: Math.max(startLng, endLng),
      west: Math.min(startLng, endLng)
    })
    console.log('==================')
    
    // Tạo bounds từ điểm đầu và điểm cuối
    const bounds = L.latLngBounds(
      [Math.min(startLat, endLat), Math.min(startLng, endLng)],
      [Math.max(startLat, endLat), Math.max(startLng, endLng)]
    )
    
    // Tính trung tâm của khu vực
    const center = bounds.getCenter()
    
    // Thêm hình chữ nhật vào danh sách với loading state
    const newRectangle: DrawnRectangle = {
      id: drawnRectangles.length > 0 ? Math.max(...drawnRectangles.map(r => r.id)) + 1 : 1,
      bounds: bounds,
      startPoint: { lat: startLat, lng: startLng },
      endPoint: { lat: endLat, lng: endLng },
      center: { lat: center.lat, lng: center.lng },
      isLoading: true,
      emoji: ''
    }
    
    setDrawnRectangles(prev => [...prev, newRectangle])
    
    // Random 10 điểm trong khu vực quét và gọi API thời tiết
    generatePointsInArea(bounds, newRectangle.id)
    
    // Reset để có thể quét tiếp (không tắt chế độ vẽ)
    setDrawStartPoint(null)
    setDrawEndPoint(null)
    setDrawBounds(null)
  }

  // Hàm xử lý khi click trên map
  const handleMapClick = async (lat: number, lng: number) => {
    // Trong mode view, không tạo điểm mới (chỉ xem thông tin từ popup)
    if (mode === 'view') {
      return
    }
    
    // Trong mode edit, tạo điểm mới
    // Tạo ID mới cho điểm (dựa trên số lượng điểm hiện tại, bao gồm cả areaPoints)
    const maxClickId = points.length > 0 ? Math.max(...points.map(p => p.id)) : 0
    const maxAreaId = areaPoints.length > 0 ? Math.max(...areaPoints.map(p => p.id)) : 0
    const newId = Math.max(maxClickId, maxAreaId) + 1
    
    // Chọn emoji ngẫu nhiên từ mảng
    const emoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)]
    
    // Tạo điểm mới với loading state và source = 'click'
    const newPoint: Point = {
      id: newId,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      emoji: emoji,
      isLoading: true,
      source: 'click'
    }
    
    // Thêm điểm mới vào danh sách với loading state
    setPoints(prevPoints => [...prevPoints, newPoint])
    
    // Gọi API lấy thông tin thời tiết
    const weather = await fetchWeatherData(lat, lng)
    
    // Console.log object thời tiết khi thành công
    if (weather) {
      console.log(`Điểm ${newId} (${emoji}) [Click] - Tọa độ: [${lat}, ${lng}] - Thời tiết:`, weather)
    } else {
      console.warn(`Điểm ${newId} (${emoji}) [Click] - Tọa độ: [${lat}, ${lng}] - Không lấy được dữ liệu thời tiết`)
    }
    
    // Cập nhật điểm với dữ liệu thời tiết và tắt loading
    setPoints(prevPoints => 
      prevPoints.map(point => 
        point.id === newId 
          ? { ...point, weather, isLoading: false }
          : point
      )
    )
  }

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
            onDrawStart={handleDrawStart}
            onDrawMove={handleDrawMove}
            onDrawEnd={handleDrawEnd}
            mode={mode}
          />

          {/* Hiển thị rectangle khi đang vẽ */}
          {drawBounds && (
            <Rectangle
              bounds={drawBounds}
              pathOptions={{
                color: '#3388ff',
                fillColor: '#3388ff',
                fillOpacity: 0.2,
                weight: 2
              }}
            />
          )}

          {/* Hiển thị tất cả các hình chữ nhật đã vẽ */}
          {drawnRectangles.map((rect) => (
            <Rectangle
              key={rect.id}
              bounds={rect.bounds}
              pathOptions={{
                color: '#ff6b6b',
                fillColor: '#ff6b6b',
                fillOpacity: 0.15,
                weight: 2
              }}
              eventHandlers={{
                contextmenu: (e) => {
                  e.originalEvent.preventDefault()
                  // Xóa hình chữ nhật và các điểm liên quan khi click chuột phải
                  setDrawnRectangles(prev => prev.filter(r => r.id !== rect.id))
                  setAreaPoints(prev => prev.filter(p => p.areaId !== rect.id))
                }
              }}
            />
          ))}

          {/* Hiển thị điểm từ click */}
          {points.map((point) => (
            <PointMarker key={`click-${point.id}`} point={point} />
          ))}

          {/* Hiển thị marker ở trung tâm mỗi khu vực */}
          {drawnRectangles.map((rect) => (
            <AreaMarker 
              key={`area-${rect.id}`} 
              rect={rect} 
              areaPoints={areaPoints}
            />
          ))}
        </MapContainer>

        <MapControls
          mode={mode}
          onModeToggle={() => {
            const newMode = mode === 'view' ? 'edit' : 'view'
            setMode(newMode)
          }}
          onTogglePointManagement={() => setIsManagementPanelOpen(!isManagementPanelOpen)}
          onToggleAreaManagement={() => setIsAreaManagementPanelOpen(!isAreaManagementPanelOpen)}
          pointsCount={points.length}
          areasCount={drawnRectangles.length}
          isManagementPanelOpen={isManagementPanelOpen}
          isAreaManagementPanelOpen={isAreaManagementPanelOpen}
        />

        {isManagementPanelOpen && (
          <PointManagementPanel
            points={points}
            onClose={() => setIsManagementPanelOpen(false)}
            onDeletePoint={(id) => setPoints(prevPoints => prevPoints.filter(p => p.id !== id))}
          />
        )}

        {isAreaManagementPanelOpen && (
          <AreaManagementPanel
            drawnRectangles={drawnRectangles}
            areaPoints={areaPoints}
            isManagementPanelOpen={isManagementPanelOpen}
            onClose={() => setIsAreaManagementPanelOpen(false)}
            onDeleteArea={(id) => {
              setDrawnRectangles(prev => prev.filter(r => r.id !== id))
              setAreaPoints(prev => prev.filter(p => p.areaId !== id))
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
