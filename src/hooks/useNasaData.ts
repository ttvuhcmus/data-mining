import { useEffect } from 'react'
import nasaData from '../../nasa.json'
import type { NASAPowerResponse } from '../types/nasa'

// Hàm đọc và xử lý dữ liệu từ nasa.json (monthly format)
export const processNasaData = () => {
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

// Hook để xử lý dữ liệu NASA khi component mount
export const useNasaData = () => {
  useEffect(() => {
    processNasaData()
  }, [])
}

