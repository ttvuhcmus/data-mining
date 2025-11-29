import { Marker, Popup } from 'react-leaflet'
import type { DrawnRectangle, Point } from '../types/nasa'
import { createFruitIcon, createLoadingIcon } from '../utils/icons'

interface AreaMarkerProps {
  rect: DrawnRectangle
  areaPoints: Point[]
}

export function AreaMarker({ rect, areaPoints }: AreaMarkerProps) {
  const areaPointsCount = areaPoints.filter(p => p.areaId === rect.id).length

  return (
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
                Đã quét {areaPointsCount} điểm trong khu vực này
              </p>
            </>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

