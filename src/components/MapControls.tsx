import type { AppMode } from '../types/app'

interface MapControlsProps {
  mode: AppMode
  onModeToggle: () => void
  onTogglePointManagement: () => void
  onToggleAreaManagement: () => void
  pointsCount: number
  areasCount: number
  isManagementPanelOpen: boolean
  isAreaManagementPanelOpen: boolean
}

export function MapControls({
  mode,
  onModeToggle,
  onTogglePointManagement,
  onToggleAreaManagement,
  pointsCount,
  areasCount,
}: MapControlsProps) {
  return (
    <div className="map-controls">
      {/* Nút chuyển đổi mode */}
      <button 
        className={`mode-toggle-button ${mode === 'view' ? 'active' : ''}`}
        onClick={onModeToggle}
        title={mode === 'view' ? 'Chuyển sang chế độ chỉnh sửa' : 'Chuyển sang chế độ xem'}
      >
        {mode === 'view' ? '👁️ Xem' : '✏️ Sửa'}
      </button>
      
      <button 
        className="toggle-management-button"
        onClick={onToggleAreaManagement}
        title="Quản lý khu vực"
      >
        🗺️ Khu vực ({areasCount})
      </button>
      <button 
        className="toggle-management-button"
        onClick={onTogglePointManagement}
        title="Quản lý địa điểm"
      >
        📋 Điểm ({pointsCount})
      </button>
    </div>
  )
}

