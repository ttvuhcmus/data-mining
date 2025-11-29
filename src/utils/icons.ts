import L from 'leaflet'

// Hàm tạo custom icon với emoji
export const createFruitIcon = (emoji: string) => {
  return L.divIcon({
    className: 'fruit-marker',
    html: `<div style="font-size: 32px; text-align: center; line-height: 1;">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

// Hàm tạo loading icon
export const createLoadingIcon = () => {
  return L.divIcon({
    className: 'loading-marker',
    html: `<div style="font-size: 24px; text-align: center; line-height: 1; animation: spin 1s linear infinite;">⏳</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

