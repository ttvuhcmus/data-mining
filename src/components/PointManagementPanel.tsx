import type { Point } from '../types/nasa'

interface PointManagementPanelProps {
  points: Point[]
  onClose: () => void
  onDeletePoint: (id: number) => void
}

export function PointManagementPanel({
  points,
  onClose,
  onDeletePoint
}: PointManagementPanelProps) {
  return (
    <div className="management-panel">
      <div className="management-panel-header">
        <h3>Quản lý địa điểm</h3>
        <button 
          className="close-panel-button"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="management-panel-content">
        <div className="points-section">
          <h4 className="section-title">📍 Điểm ({points.length})</h4>
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
                    <strong>Điểm {point.id}</strong>
                    <button
                      className="delete-point-button"
                      onClick={() => onDeletePoint(point.id)}
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
  )
}

