// NASA POWER API Response interfaces
// Response structure: properties.parameter.T2M = { "YYYYMMDD": value }
export interface NASAPowerResponse {
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

export interface WeatherData {
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

export interface Point {
  id: number
  lat: number
  lng: number
  emoji: string
  weather?: WeatherData
  isLoading?: boolean
  source?: 'click' | 'area' // Phân biệt điểm từ click hay từ quét khu vực
  areaId?: number // ID của khu vực nếu điểm được tạo từ quét khu vực
}

export interface DrawnRectangle {
  id: number
  bounds: L.LatLngBounds
  startPoint: { lat: number; lng: number }
  endPoint: { lat: number; lng: number }
  center: { lat: number; lng: number }
  isLoading: boolean
  emoji: string
}

