import { Marker, Popup } from 'react-leaflet'
import type { Point } from '../types/nasa'
import { createFruitIcon, createLoadingIcon } from '../utils/icons'

interface PointMarkerProps {
  point: Point
}

export function PointMarker({ point }: PointMarkerProps) {
  return (
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
            </>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

