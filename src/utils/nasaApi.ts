import type { NASAPowerResponse, WeatherData } from '../types/nasa'

// Hàm helper để tính tháng trước đó từ một tháng cho trước (year, month)
export const getPreviousMonthFrom = (year: number, month: number): { year: number; month: string } => {
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

// Hàm helper để tính tháng trước đó từ tháng hiện tại
export const getPreviousMonth = (): { year: number; month: string } => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentYear = now.getFullYear()
  
  return getPreviousMonthFrom(currentYear, currentMonth)
}

// Hàm kiểm tra xem có field nào = -999 không
export const hasInvalidData = (
  params: NonNullable<NASAPowerResponse['properties']>['parameter'], 
  monthKey: string, 
  fillValue: number = -999
): boolean => {
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
export const fetchNASAPowerData = async (
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
export const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData | undefined> => {
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

