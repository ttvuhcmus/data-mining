import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

import L from 'leaflet'
import type { Map } from 'leaflet'
import nasaData from '../nasa.json'

// Mảng emoji trái cây
const fruitEmojis = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑', '🍒', '🥝', '🍉', '🥭', '🍐', '🍋', '🥥', '🍍', '🫐']

// NASA POWER API Response interfaces
// Response structure: properties.parameter.T2M = { "YYYYMMDD": value }
interface NASAPowerResponse {
  properties?: {
    parameter?: {
      // Temperature
      T2M?: { [date: string]: number } // Nhiệt độ trung bình (°C)
      T2M_MAX?: { [date: string]: number } // Nhiệt độ tối đa (°C)
      T2M_MIN?: { [date: string]: number } // Nhiệt độ tối thiểu (°C)
      T2MWET?: { [date: string]: number } // Nhiệt độ bầu ướt (°C)
      T2MDEW?: { [date: string]: number } // Nhiệt độ điểm sương (°C)
      TS?: { [date: string]: number } // Nhiệt độ bề mặt đất (°C)
      T2M_RANGE?: { [date: string]: number } // Khoảng nhiệt độ (°C)
      // Humidity & Precipitation
      RH2M?: { [date: string]: number } // Độ ẩm tương đối (%)
      PRECTOTCORR?: { [date: string]: number } // Lượng mưa (mm/day)
      QV2M?: { [date: string]: number } // Độ ẩm tuyệt đối (kg/kg)
      // Wind
      WS2M?: { [date: string]: number } // Tốc độ gió 2m (m/s)
      WS10M?: { [date: string]: number } // Tốc độ gió 10m (m/s)
      WS50M?: { [date: string]: number } // Tốc độ gió 50m (m/s)
      WD50M?: { [date: string]: number } // Hướng gió 50m (°)
      WS2M_RANGE?: { [date: string]: number } // Khoảng tốc độ gió 2m (m/s)
      // Solar Radiation
      ALLSKY_SFC_SW_DWN?: { [date: string]: number } // Bức xạ mặt trời (MJ/m²/day)
      ALLSKY_SFC_PAR_TOT?: { [date: string]: number } // PAR tổng (mol/m²/day)
      ALLSKY_SFC_UV_INDEX?: { [date: string]: number } // Chỉ số UV
      // Cloud & Pressure
      CLOUD_AMT?: { [date: string]: number } // Lượng mây (%)
      PS?: { [date: string]: number } // Áp suất bề mặt (kPa)
      // Geographic
      grid_code?: { [date: string]: number }
      FIPS0?: { [date: string]: number }
      FIPS1?: { [date: string]: number }
      FIPS2?: { [date: string]: number }
      ADM0_NAME?: { [date: string]: string }
      ADM1_NAME?: { [date: string]: string }
      ADM2_NAME?: { [date: string]: string }
      rec_type?: { [date: string]: string }
      crops?: { [date: string]: string }
    }
  }
  geometry?: {
    coordinates: number[]
  }
  header?: {
    start?: string
    end?: string
    fill_value?: number
  }
  parameters?: {
    [key: string]: {
      units?: string
      longname?: string
    }
  }
}

interface WeatherData {
  // Temperature
  temperature?: number // T2M
  temperature_max?: number // T2M_MAX
  temperature_min?: number // T2M_MIN
  wet_bulb?: number // T2MWET
  dew_point?: number // T2MDEW
  surface_temperature?: number // TS
  temperature_range?: number // T2M_RANGE
  // Humidity & Precipitation
  humidity?: number // RH2M
  precipitation?: number // PRECTOTCORR
  absolute_humidity?: number // QV2M
  // Wind
  windspeed_2m?: number // WS2M
  windspeed_10m?: number // WS10M
  windspeed_50m?: number // WS50M
  wind_direction_50m?: number // WD50M
  windspeed_range_2m?: number // WS2M_RANGE
  // Solar Radiation
  solar_radiation?: number // ALLSKY_SFC_SW_DWN
  par_total?: number // ALLSKY_SFC_PAR_TOT
  uv_index?: number // ALLSKY_SFC_UV_INDEX
  // Cloud & Pressure
  cloud_amount?: number // CLOUD_AMT
  surface_pressure?: number // PS
  date?: string
}

interface Point {
  id: number
  lat: number
  lng: number
  emoji: string
  weather?: WeatherData
  isLoading?: boolean
  source?: 'click' | 'area' // Phân biệt điểm từ click hay từ quét khu vực
  areaId?: number // ID của khu vực nếu điểm được tạo từ quét khu vực
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

// Hàm tạo loading icon
const createLoadingIcon = () => {
  return L.divIcon({
    className: 'loading-marker',
    html: `<div style="font-size: 24px; text-align: center; line-height: 1; animation: spin 1s linear infinite;">⏳</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

// Component to handle map events and expose map instance
function MapController({ 
  onZoomChange,
  onMapReady,
  onMapClick,
  isDrawing,
  onDrawStart,
  onDrawMove,
  onDrawEnd
}: { 
  onZoomChange: (zoom: number) => void
  onMapReady: (map: L.Map) => void
  onMapClick: (lat: number, lng: number) => void
  isDrawing: boolean
  onDrawStart: (lat: number, lng: number) => void
  onDrawMove: (lat: number, lng: number) => void
  onDrawEnd: (startLat: number, startLng: number, endLat: number, endLng: number) => void
}) {
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
    if (!isDrawing) {
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        onMapClick(lat, lng)
      }

      map.on('click', handleMapClick)

      return () => {
        map.off('click', handleMapClick)
      }
    }
  }, [map, onMapClick, isDrawing])

  useEffect(() => {
    if (!isDrawing) {
      isDrawingRef.current = false
      startPointRef.current = null
      // Bật lại tính năng kéo bản đồ
      map.dragging.enable()
      map.getContainer().style.cursor = ''
      return
    }

    // Vô hiệu hóa tính năng kéo bản đồ khi ở chế độ vẽ
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
  }, [map, isDrawing, onDrawStart, onDrawMove, onDrawEnd])

  return null
}

function App() {
  const [points, setPoints] = useState<Point[]>([])
  const [mapZoom, setMapZoom] = useState<number>(13)
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState<boolean>(false)
  const [isAreaManagementPanelOpen, setIsAreaManagementPanelOpen] = useState<boolean>(false)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [drawStartPoint, setDrawStartPoint] = useState<L.LatLng | null>(null)
  const [drawEndPoint, setDrawEndPoint] = useState<L.LatLng | null>(null)
  const [drawBounds, setDrawBounds] = useState<L.LatLngBounds | null>(null)
  const [drawnRectangles, setDrawnRectangles] = useState<Array<{
    id: number
    bounds: L.LatLngBounds
    startPoint: { lat: number; lng: number }
    endPoint: { lat: number; lng: number }
    center: { lat: number; lng: number }
    isLoading: boolean
    emoji: string
  }>>([])
  const [areaPoints, setAreaPoints] = useState<Point[]>([]) // Điểm từ quét khu vực (tách biệt với điểm click) - dùng để lưu dữ liệu
  const drawingRef = useRef<boolean>(false)

  // Hàm đọc và xử lý dữ liệu từ nasa.json (monthly format)
  const processNasaData = () => {
    const data = nasaData as NASAPowerResponse
    
    // Lấy tọa độ từ geometry
    const coordinates = data.geometry?.coordinates || []
    const lng = coordinates[0]
    const lat = coordinates[1]
    const elevation = coordinates[2]
    
    // Lấy các tham số thời tiết từ properties.parameter
    const params = data.properties?.parameter || {}
    
    // Lấy tất cả các keys từ params (format YYYYMM cho monthly data)
    const monthKeys = new Set<string>()
    Object.keys(params).forEach((paramKey) => {
      const paramData = params[paramKey as keyof typeof params]
      if (paramData && typeof paramData === 'object') {
        Object.keys(paramData).forEach((dateKey) => {
          monthKeys.add(dateKey)
        })
      }
    })
    
    // Tạo object chứa thông tin thời tiết cho từng tháng
    const weatherDataByMonth: { [month: string]: {
      location: {
        longitude: number
        latitude: number
        elevation: number
      }
      month: string
      temperature: {
        T2M?: number
        T2M_MAX?: number
        T2M_MIN?: number
        T2MWET?: number
        T2MDEW?: number
        TS?: number
        T2M_RANGE?: number
      }
      humidity: {
        RH2M?: number
        QV2M?: number
      }
      precipitation: {
        PRECTOTCORR?: number
      }
      wind: {
        WS2M?: number
        WS10M?: number
        WS50M?: number
        WD50M?: number
        WS2M_RANGE?: number
      }
      solar: {
        ALLSKY_SFC_SW_DWN?: number
        ALLSKY_SFC_PAR_TOT?: number
        ALLSKY_SFC_UV_INDEX?: number
      }
      cloud: {
        CLOUD_AMT?: number
      }
      pressure: {
        PS?: number
      }
    } } = {}
    
    // Xử lý từng tháng
    monthKeys.forEach((monthKey) => {
      weatherDataByMonth[monthKey] = {
        location: {
          longitude: lng,
          latitude: lat,
          elevation: elevation
        },
        month: monthKey,
        temperature: {},
        humidity: {},
        precipitation: {},
        wind: {},
        solar: {},
        cloud: {},
        pressure: {}
      }
      
      // Lấy tất cả các giá trị thời tiết từ params cho tháng này
      Object.keys(params).forEach((paramKey) => {
        const paramData = params[paramKey as keyof typeof params]
        if (paramData && typeof paramData === 'object' && monthKey in paramData) {
          const value = paramData[monthKey]
          if (value !== undefined && typeof value === 'number') {
            // Phân loại các tham số vào các nhóm tương ứng
            if (['T2M', 'T2M_MAX', 'T2M_MIN', 'T2MWET', 'T2MDEW', 'TS', 'T2M_RANGE'].includes(paramKey)) {
              (weatherDataByMonth[monthKey].temperature as { [key: string]: number })[paramKey] = value
            } else if (['RH2M', 'QV2M'].includes(paramKey)) {
              (weatherDataByMonth[monthKey].humidity as { [key: string]: number })[paramKey] = value
            } else if (paramKey === 'PRECTOTCORR') {
              weatherDataByMonth[monthKey].precipitation[paramKey] = value
            } else if (['WS2M', 'WS10M', 'WS50M', 'WD50M', 'WS2M_RANGE'].includes(paramKey)) {
              (weatherDataByMonth[monthKey].wind as { [key: string]: number })[paramKey] = value
            } else if (['ALLSKY_SFC_SW_DWN', 'ALLSKY_SFC_PAR_TOT', 'ALLSKY_SFC_UV_INDEX'].includes(paramKey)) {
              (weatherDataByMonth[monthKey].solar as { [key: string]: number })[paramKey] = value
            } else if (paramKey === 'CLOUD_AMT') {
              weatherDataByMonth[monthKey].cloud[paramKey] = value
            } else if (paramKey === 'PS') {
              weatherDataByMonth[monthKey].pressure[paramKey] = value
            }
          }
        }
      })
    })
    
    // Console.log object thời tiết (tất cả các tháng)
    console.log('Thông tin thời tiết từ nasa.json (monthly):', weatherDataByMonth)
  }

  // Đọc và xử lý dữ liệu từ nasa.json khi component mount
  useEffect(() => {
    processNasaData()
  }, [])

  // Hàm helper để tính tháng trước đó từ tháng hiện tại
  const getPreviousMonth = (): { year: number; month: string } => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()
    
    let previousMonth: number
    let previousYear: number
    
    if (currentMonth === 1) {
      // Nếu là tháng 1, lấy tháng 12 năm trước
      previousMonth = 12
      previousYear = currentYear - 1
    } else {
      previousMonth = currentMonth - 1
      previousYear = currentYear
    }
    
    return {
      year: previousYear,
      month: String(previousMonth).padStart(2, '0')
    }
  }

  // Hàm helper để tính tháng trước đó từ một tháng cho trước (year, month)
  const getPreviousMonthFrom = (year: number, month: number): { year: number; month: string } => {
    let previousMonth: number
    let previousYear: number
    
    if (month === 1) {
      // Nếu là tháng 1, lấy tháng 12 năm trước
      previousMonth = 12
      previousYear = year - 1
    } else {
      previousMonth = month - 1
      previousYear = year
    }
    
    return {
      year: previousYear,
      month: String(previousMonth).padStart(2, '0')
    }
  }

  // Hàm kiểm tra xem có field nào = -999 không
  const hasInvalidData = (params: NonNullable<NASAPowerResponse['properties']>['parameter'], monthKey: string, fillValue: number = -999): boolean => {
    if (!params) return true
    
    // Danh sách các parameters cần kiểm tra
    const requiredParams = ['T2M', 'T2M_MAX', 'T2M_MIN', 'T2MWET', 'T2MDEW', 'RH2M', 'PRECTOTCORR', 'WS2M', 'WS10M', 'WS50M', 'WD50M', 'ALLSKY_SFC_SW_DWN', 'ALLSKY_SFC_PAR_TOT', 'ALLSKY_SFC_UV_INDEX', 'CLOUD_AMT', 'PS', 'QV2M', 'TS', 'T2M_RANGE', 'WS2M_RANGE']
    
    for (const paramKey of requiredParams) {
      const paramData = params[paramKey as keyof typeof params]
      if (paramData && typeof paramData === 'object' && monthKey in paramData) {
        const value = paramData[monthKey]
        if (value === fillValue || value === undefined) {
          return true // Có field = -999 hoặc undefined
        }
      } else {
        return true // Không có dữ liệu cho parameter này
      }
    }
    
    return false // Tất cả field đều hợp lệ
  }

  // Hàm helper để gọi NASA POWER API với monthly data
  const fetchNASAPowerData = async (
    lat: number, 
    lng: number, 
    parameters: string, 
    year: number
  ): Promise<NASAPowerResponse | undefined> => {
    try {
      const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${parameters}&community=SB&longitude=${lng}&latitude=${lat}&start=${year}&end=${year}&format=JSON`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`NASA POWER API error! status: ${response.status}`)
      }
      
      const data: NASAPowerResponse = await response.json()
      
      if (!data.properties?.parameter) {
        throw new Error('No weather data returned from NASA POWER API')
      }
      
      return data
    } catch (error) {
      console.error(`Lỗi khi gọi NASA POWER API với parameters ${parameters}:`, error)
      return undefined
    }
  }

  // Hàm lấy thông tin thời tiết từ NASA POWER API (monthly)
  // Lùi lại tháng nếu có field = -999 cho đến khi tất cả field đều hợp lệ
  const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData | undefined> => {
    try {
      // Bắt đầu từ tháng trước đó
      let { year, month } = getPreviousMonth()
      let monthKey = `${year}${month}` // Format: YYYYMM (ví dụ: 202410)
      
      // NASA POWER API - chỉ lấy các parameters thời tiết
      const parameters = 'T2M,T2M_MAX,T2M_MIN,T2MWET,T2MDEW,RH2M,PRECTOTCORR,WS2M,WS10M,WS50M,WD50M,ALLSKY_SFC_SW_DWN,ALLSKY_SFC_PAR_TOT,ALLSKY_SFC_UV_INDEX,CLOUD_AMT,PS,QV2M,TS,T2M_RANGE,WS2M_RANGE'
      
      // Lấy dữ liệu cho năm hiện tại (có thể cần lấy nhiều năm nếu lùi quá xa)
      const currentYear = new Date().getFullYear()
      const data = await fetchNASAPowerData(lat, lng, parameters, currentYear)
      
      if (!data) {
        return undefined
      }
      
      const params = data.properties?.parameter || {}
      const fillValue = data.header?.fill_value ?? -999
      
      // Lùi lại tháng cho đến khi tất cả field đều khác -999
      let attempts = 0
      const maxAttempts = 24 // Giới hạn tối đa 24 tháng (2 năm)
      
      while (attempts < maxAttempts) {
        // Kiểm tra xem có field nào = -999 không
        if (!hasInvalidData(params, monthKey, fillValue)) {
          // Tất cả field đều hợp lệ, lấy dữ liệu
          return {
            // Temperature
            temperature: params.T2M?.[monthKey],
            temperature_max: params.T2M_MAX?.[monthKey],
            temperature_min: params.T2M_MIN?.[monthKey],
            wet_bulb: params.T2MWET?.[monthKey],
            dew_point: params.T2MDEW?.[monthKey],
            surface_temperature: params.TS?.[monthKey],
            temperature_range: params.T2M_RANGE?.[monthKey],
            // Humidity & Precipitation
            humidity: params.RH2M?.[monthKey],
            precipitation: params.PRECTOTCORR?.[monthKey],
            absolute_humidity: params.QV2M?.[monthKey],
            // Wind
            windspeed_2m: params.WS2M?.[monthKey],
            windspeed_10m: params.WS10M?.[monthKey],
            windspeed_50m: params.WS50M?.[monthKey],
            wind_direction_50m: params.WD50M?.[monthKey],
            windspeed_range_2m: params.WS2M_RANGE?.[monthKey],
            // Solar Radiation
            solar_radiation: params.ALLSKY_SFC_SW_DWN?.[monthKey],
            par_total: params.ALLSKY_SFC_PAR_TOT?.[monthKey],
            uv_index: params.ALLSKY_SFC_UV_INDEX?.[monthKey],
            // Cloud & Pressure
            cloud_amount: params.CLOUD_AMT?.[monthKey],
            surface_pressure: params.PS?.[monthKey],
            date: monthKey
          }
        }
        
        // Có field = -999, lùi lại tháng trước
        const monthNum = parseInt(month, 10)
        const prevMonthData = getPreviousMonthFrom(year, monthNum)
        year = prevMonthData.year
        month = prevMonthData.month
        monthKey = `${year}${month}`
        attempts++
        
        // Nếu năm thay đổi, cần fetch dữ liệu năm mới
        if (year !== currentYear && attempts === 1) {
          const prevYearData = await fetchNASAPowerData(lat, lng, parameters, year)
          if (prevYearData && prevYearData.properties?.parameter) {
            // Merge dữ liệu từ năm trước vào params
            Object.keys(prevYearData.properties.parameter).forEach((key) => {
              const paramKey = key as keyof typeof params
              const prevParam = prevYearData.properties?.parameter?.[paramKey]
              const currentParam = params[paramKey]
              if (prevParam && currentParam && typeof prevParam === 'object' && typeof currentParam === 'object') {
                // Merge các giá trị từ năm trước vào params hiện tại
                Object.keys(prevParam).forEach((dateKey) => {
                  if (typeof prevParam === 'object' && dateKey in prevParam && typeof currentParam === 'object') {
                    (currentParam as { [key: string]: number })[dateKey] = (prevParam as { [key: string]: number })[dateKey]
                  }
                })
              }
            })
          }
        }
      }
      
      // Nếu đã lùi quá nhiều mà vẫn không tìm thấy dữ liệu hợp lệ
      console.warn(`Không tìm thấy dữ liệu hợp lệ sau ${maxAttempts} lần lùi tháng cho điểm (${lat}, ${lng})`)
      return undefined
    } catch (error) {
      console.error(`Lỗi khi lấy dữ liệu thời tiết từ NASA POWER cho điểm (${lat}, ${lng}):`, error)
      return undefined
    }
  }

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
  const handleDrawEnd = (startLat: number, startLng: number, endLat: number, endLng: number) => {
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
    const newRectangle = {
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
    // Không tắt chế độ vẽ: setIsDrawing(false) - đã xóa
  }

  // Hàm xử lý khi click trên map (chỉ khi không ở chế độ vẽ)
  const handleMapClick = async (lat: number, lng: number) => {
    if (isDrawing) return // Không xử lý click khi đang vẽ
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
            onMapClick={handleMapClick}
            isDrawing={isDrawing}
            onDrawStart={handleDrawStart}
            onDrawMove={handleDrawMove}
            onDrawEnd={handleDrawEnd}
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
            <Marker 
              key={`click-${point.id}`} 
              position={[point.lat, point.lng]}
              icon={point.isLoading ? createLoadingIcon() : createFruitIcon(point.emoji)}
            >
              <Popup>
                <div>
                  {point.isLoading ? (
                    <>
                      <span style={{ fontSize: '24px', marginRight: '8px' }}>⏳</span>
                      <strong>Đang tải...</strong>
                    </>
                  ) : (
                    <>
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>{point.emoji}</span>
                  <strong>Điểm {point.id} [Click]</strong>
                  <br />
                  Latitude: {point.lat}
                  <br />
                  Longitude: {point.lng}
                  <br />
                  Bạn nên trồng cây này vì: ...
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hiển thị marker ở trung tâm mỗi khu vực */}
          {drawnRectangles.map((rect) => (
            <Marker 
              key={`area-${rect.id}`} 
              position={[rect.center.lat, rect.center.lng]}
              icon={rect.isLoading ? createLoadingIcon() : createFruitIcon(rect.emoji)}
            >
              <Popup>
                <div>
                  {rect.isLoading ? (
                    <>
                      <span style={{ fontSize: '24px', marginRight: '8px' }}>⏳</span>
                      <strong>Đang tải...</strong>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '24px', marginRight: '8px' }}>{rect.emoji}</span>
                      <strong>Khu vực {rect.id}</strong>
                      <br />
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Đã quét {areaPoints.filter(p => p.areaId === rect.id).length} điểm trong khu vực này
                      </p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="map-controls">
          <button 
            className={`draw-area-button ${isDrawing ? 'active' : ''}`}
            onClick={() => setIsDrawing(!isDrawing)}
            title={isDrawing ? 'Nhấn để tắt chế độ quét' : 'Nhấn để bật chế độ quét khu vực'}
          >
            {isDrawing ? '🛑' : '📐'} {isDrawing ? 'Đang quét...' : 'Quét khu vực'}
          </button>
          <button 
            className="toggle-management-button"
            onClick={() => setIsAreaManagementPanelOpen(!isAreaManagementPanelOpen)}
          >
            {isAreaManagementPanelOpen ? '🗺️' : '🗺️'} Quản lý khu vực ({drawnRectangles.length})
          </button>
          <button 
            className="toggle-management-button"
            onClick={() => setIsManagementPanelOpen(!isManagementPanelOpen)}
          >
            {isManagementPanelOpen ? '📋' : '📋'} Quản lý địa điểm ({points.length})
          </button>
        </div>

        {isManagementPanelOpen && (
          <div className="management-panel">
            <div className="management-panel-header">
              <h3>Quản lý địa điểm</h3>
              <button 
                className="close-panel-button"
                onClick={() => setIsManagementPanelOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="management-panel-content">
              {/* Tab hoặc section cho điểm click */}
              <div className="points-section">
                <h4 className="section-title">📍 Điểm từ Click ({points.length})</h4>
                {points.length === 0 ? (
                  <div className="empty-state">
                    <p>Chưa có địa điểm nào được chọn</p>
                    <p className="hint">👆 Click trên bản đồ để chọn địa điểm</p>
                  </div>
                ) : (
                  <div className="points-management-list">
                    {points.map((point) => (
                      <div key={`click-${point.id}`} className="management-point-item">
                        <div className="point-item-header">
                          <span style={{ fontSize: '24px', marginRight: '8px' }}>
                            {point.isLoading ? '⏳' : point.emoji}
                          </span>
                          <strong>Điểm {point.id} [Click]</strong>
                          <button
                            className="delete-point-button"
                            onClick={() => {
                              setPoints(prevPoints => prevPoints.filter(p => p.id !== point.id))
                            }}
                            title="Xóa điểm"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="point-item-details">
                          <p><strong>Tọa độ:</strong> {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
                          {point.isLoading ? (
                            <p className="loading-status">⏳ Đang tải dữ liệu thời tiết...</p>
                          ) : point.weather ? (
                            <div className="weather-summary">
                              <p><strong>Thời tiết:</strong></p>
                              {point.weather.temperature !== undefined && (
                                <p>🌡️ Nhiệt độ: {point.weather.temperature.toFixed(2)}°C</p>
                              )}
                              {point.weather.humidity !== undefined && (
                                <p>💧 Độ ẩm: {point.weather.humidity.toFixed(2)}%</p>
                              )}
                              {point.weather.precipitation !== undefined && (
                                <p>🌧️ Lượng mưa: {point.weather.precipitation.toFixed(2)} mm/day</p>
                              )}
                              {point.weather.date && (
                                <p className="date-info">📅 Tháng: {point.weather.date}</p>
                              )}
                            </div>
                          ) : (
                            <p className="error-status">❌ Không có dữ liệu thời tiết</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section cho điểm từ quét khu vực */}
              <div className="points-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
                <h4 className="section-title">📐 Điểm từ Quét Khu Vực ({areaPoints.length})</h4>
                {areaPoints.length === 0 ? (
                  <div className="empty-state">
                    <p>Chưa có điểm nào từ quét khu vực</p>
                    <p className="hint">📐 Quét khu vực để tự động tạo 10 điểm</p>
                  </div>
                ) : (
                  <div className="points-management-list">
                    {areaPoints.map((point) => (
                      <div key={`area-${point.id}`} className="management-point-item">
                        <div className="point-item-header">
                          <span style={{ fontSize: '24px', marginRight: '8px' }}>
                            {point.isLoading ? '⏳' : point.emoji}
                          </span>
                          <strong>Điểm {point.id} [KV {point.areaId}]</strong>
                          <button
                            className="delete-point-button"
                            onClick={() => {
                              setAreaPoints(prevPoints => prevPoints.filter(p => p.id !== point.id))
                            }}
                            title="Xóa điểm"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="point-item-details">
                          <p><strong>Tọa độ:</strong> {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
                          {point.isLoading ? (
                            <p className="loading-status">⏳ Đang tải dữ liệu thời tiết...</p>
                          ) : point.weather ? (
                            <div className="weather-summary">
                              <p><strong>Thời tiết:</strong></p>
                              {point.weather.temperature !== undefined && (
                                <p>🌡️ Nhiệt độ: {point.weather.temperature.toFixed(2)}°C</p>
                              )}
                              {point.weather.humidity !== undefined && (
                                <p>💧 Độ ẩm: {point.weather.humidity.toFixed(2)}%</p>
                              )}
                              {point.weather.precipitation !== undefined && (
                                <p>🌧️ Lượng mưa: {point.weather.precipitation.toFixed(2)} mm/day</p>
                              )}
                              {point.weather.date && (
                                <p className="date-info">📅 Tháng: {point.weather.date}</p>
                              )}
                            </div>
                          ) : (
                            <p className="error-status">❌ Không có dữ liệu thời tiết</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isAreaManagementPanelOpen && (
          <div className="management-panel" style={{ 
            top: '60px', 
            right: isManagementPanelOpen ? '370px' : '10px',
            zIndex: 1001
          }}>
            <div className="management-panel-header">
              <h3>Quản lý khu vực ({drawnRectangles.length})</h3>
              <button 
                className="close-panel-button"
                onClick={() => setIsAreaManagementPanelOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="management-panel-content">
              {drawnRectangles.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có khu vực nào được quét</p>
                  <p className="hint">📐 Quét khu vực trên bản đồ để tạo khu vực mới</p>
                </div>
              ) : (
                <div className="points-management-list">
                  {drawnRectangles.map((rect) => {
                    const areaPointsCount = areaPoints.filter(p => p.areaId === rect.id).length
                    const areaPointsWithWeather = areaPoints.filter(p => p.areaId === rect.id && p.weather).length
                    
                    return (
                      <div key={rect.id} className="management-point-item">
                        <div className="point-item-header">
                          <span style={{ fontSize: '24px', marginRight: '8px' }}>
                            {rect.isLoading ? '⏳' : rect.emoji || '🗺️'}
                          </span>
                          <strong>Khu vực {rect.id}</strong>
                          <button
                            className="delete-point-button"
                            onClick={() => {
                              setDrawnRectangles(prev => prev.filter(r => r.id !== rect.id))
                              setAreaPoints(prev => prev.filter(p => p.areaId !== rect.id))
                            }}
                            title="Xóa khu vực"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="point-item-details">
                          <p><strong>Trung tâm:</strong> {rect.center.lat.toFixed(6)}, {rect.center.lng.toFixed(6)}</p>
                          <p><strong>Điểm đầu:</strong> {rect.startPoint.lat.toFixed(6)}, {rect.startPoint.lng.toFixed(6)}</p>
                          <p><strong>Điểm cuối:</strong> {rect.endPoint.lat.toFixed(6)}, {rect.endPoint.lng.toFixed(6)}</p>
                          {rect.isLoading ? (
                            <p className="loading-status">⏳ Đang tải dữ liệu thời tiết cho {areaPointsCount} điểm...</p>
                          ) : (
                            <div className="weather-summary">
                              <p><strong>Thống kê:</strong></p>
                              <p>📊 Tổng số điểm: {areaPointsCount}</p>
                              <p>✅ Đã có dữ liệu: {areaPointsWithWeather}/{areaPointsCount}</p>
                              {areaPointsWithWeather > 0 && (
                                <>
                                  <p style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e9ecef' }}>
                                    <strong>Thời tiết trung bình:</strong>
                                  </p>
                                  {(() => {
                                    const weathers = areaPoints.filter(p => p.areaId === rect.id && p.weather).map(p => p.weather!)
                                    const avgTemp = weathers.reduce((sum, w) => sum + (w.temperature || 0), 0) / weathers.length
                                    const avgHumidity = weathers.reduce((sum, w) => sum + (w.humidity || 0), 0) / weathers.length
                                    const avgPrecipitation = weathers.reduce((sum, w) => sum + (w.precipitation || 0), 0) / weathers.length
                                    
                                    return (
                                      <>
                                        {avgTemp > 0 && <p>🌡️ Nhiệt độ TB: {avgTemp.toFixed(2)}°C</p>}
                                        {avgHumidity > 0 && <p>💧 Độ ẩm TB: {avgHumidity.toFixed(2)}%</p>}
                                        {avgPrecipitation > 0 && <p>🌧️ Lượng mưa TB: {avgPrecipitation.toFixed(2)} mm/day</p>}
                                      </>
                                    )
                                  })()}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default App
