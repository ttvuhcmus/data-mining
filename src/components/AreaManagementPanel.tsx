import type { DrawnRectangle, Point } from '../types/nasa'

interface AreaManagementPanelProps {
  drawnRectangles: DrawnRectangle[]
  areaPoints: Point[]
  isManagementPanelOpen: boolean
  onClose: () => void
  onDeleteArea: (id: number) => void
}

export function AreaManagementPanel({
  drawnRectangles,
  areaPoints,
  isManagementPanelOpen,
  onClose,
  onDeleteArea
}: AreaManagementPanelProps) {
  return (
    <div 
      className="management-panel" 
      style={{ 
        top: '60px', 
        right: isManagementPanelOpen ? '370px' : '10px',
        zIndex: 1001
      }}
    >
      <div className="management-panel-header">
        <h3>Quản lý khu vực ({drawnRectangles.length})</h3>
        <button 
          className="close-panel-button"
          onClick={onClose}
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
                      onClick={() => onDeleteArea(rect.id)}
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
  )
}

