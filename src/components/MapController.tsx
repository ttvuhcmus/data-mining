import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { AppMode } from '../types/app'

interface MapControllerProps {
  onZoomChange: (zoom: number) => void
  onMapReady: (map: L.Map) => void
  onDrawStart: (lat: number, lng: number) => void
  onDrawMove: (lat: number, lng: number) => void
  onDrawEnd: (startLat: number, startLng: number, endLat: number, endLng: number) => void
  mode: AppMode
}

export function MapController({ 
  onZoomChange,
  onMapReady,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  mode
}: MapControllerProps) {
  const map = useMap()
  const isDrawingRef = useRef(false)
  const startPointRef = useRef<L.LatLng | null>(null)

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

  useEffect(() => {
    // Chỉ xử lý vẽ trong mode edit (luôn bật trong mode edit)
    if (mode !== 'edit') {
      isDrawingRef.current = false
      startPointRef.current = null
      // Bật lại tính năng kéo bản đồ
      map.dragging.enable()
      map.getContainer().style.cursor = ''
      return
    }

    // Vô hiệu hóa tính năng kéo bản đồ khi ở chế độ vẽ (chỉ trong mode edit)
    map.dragging.disable()
    // Thay đổi cursor
    map.getContainer().style.cursor = 'crosshair'

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // Chỉ xử lý click chuột trái
      
      // Ngăn chặn sự kiện mặc định để không di chuyển bản đồ
      e.preventDefault()
      e.stopPropagation()
      
      // Chuyển đổi pixel coordinates sang lat/lng
      const containerPoint = map.mouseEventToContainerPoint(e)
      const latlng = map.containerPointToLatLng(containerPoint)
      
      isDrawingRef.current = true
      startPointRef.current = latlng
      onDrawStart(latlng.lat, latlng.lng)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current || !startPointRef.current) return
      
      // Ngăn chặn sự kiện mặc định
      e.preventDefault()
      e.stopPropagation()
      
      // Chuyển đổi pixel coordinates sang lat/lng
      const containerPoint = map.mouseEventToContainerPoint(e)
      const latlng = map.containerPointToLatLng(containerPoint)
      
      onDrawMove(latlng.lat, latlng.lng)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawingRef.current || !startPointRef.current) return
      
      // Ngăn chặn sự kiện mặc định
      e.preventDefault()
      e.stopPropagation()
      
      // Chuyển đổi pixel coordinates sang lat/lng
      const containerPoint = map.mouseEventToContainerPoint(e)
      const latlng = map.containerPointToLatLng(containerPoint)
      
      isDrawingRef.current = false
      const start = startPointRef.current
      onDrawEnd(start.lat, start.lng, latlng.lat, latlng.lng)
      startPointRef.current = null
    }

    // Sử dụng capture phase để bắt sự kiện trước khi Leaflet xử lý
    const mapContainer = map.getContainer()
    
    mapContainer.addEventListener('mousedown', handleMouseDown, true)
    mapContainer.addEventListener('mousemove', handleMouseMove, true)
    mapContainer.addEventListener('mouseup', handleMouseUp, true)

    return () => {
      mapContainer.removeEventListener('mousedown', handleMouseDown, true)
      mapContainer.removeEventListener('mousemove', handleMouseMove, true)
      mapContainer.removeEventListener('mouseup', handleMouseUp, true)
      map.dragging.enable()
      map.getContainer().style.cursor = ''
    }
  }, [map, onDrawStart, onDrawMove, onDrawEnd, mode])

  return null
}

