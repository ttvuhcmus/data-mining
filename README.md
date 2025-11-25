# Bản đồ Tìm kiếm Khu vực với Leaflet

Website sử dụng Leaflet.js để hiển thị bản đồ, với chức năng tạo ngẫu nhiên 10 điểm trong khu vực hiển thị khi zoom vào.

## Tính năng

- ✅ Hiển thị bản đồ tương tác sử dụng Leaflet.js
- ✅ Button "Tìm kiếm trong khu vực này" xuất hiện khi zoom >= 10
- ✅ Tạo ngẫu nhiên 10 điểm trong vùng hiển thị
- ✅ Hiển thị tọa độ (latitude, longitude) của mỗi điểm
- ✅ Marker trên bản đồ với popup hiển thị thông tin

## Cài đặt và Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build
```

## Thư viện đã sử dụng

### 1. **Leaflet** (leaflet)
- Thư viện bản đồ mã nguồn mở phổ biến nhất
- Nhẹ, hiệu năng cao, dễ sử dụng
- Website: https://leafletjs.com/
- GitHub: https://github.com/Leaflet/Leaflet

### 2. **React-Leaflet** (react-leaflet)
- Wrapper React cho Leaflet
- Tích hợp tốt với React hooks và components
- Website: https://react-leaflet.js.org/
- GitHub: https://github.com/PaulLeCam/react-leaflet

## Gợi ý các thư viện/Open Source khác cho tính năng tương tự

### Cho việc tạo điểm ngẫu nhiên trong bounds:

#### 1. **Turf.js** ⭐ (Khuyên dùng)
- Thư viện geospatial analysis mạnh mẽ
- Có hàm `randomPoint()` để tạo điểm ngẫu nhiên trong polygon/bounds
- Hỗ trợ nhiều tính năng geospatial khác
- Website: https://turfjs.org/
- GitHub: https://github.com/Turfjs/turf
- Cài đặt: `npm install @turf/turf`
- Ví dụ:
```javascript
import { randomPoint } from '@turf/random-point';
import { bbox } from '@turf/bbox';

const bounds = map.getBounds();
const bboxArray = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
const points = randomPoint(10, { bbox: bboxArray });
```

#### 2. **Geolib**
- Thư viện tính toán địa lý
- Có thể tạo điểm ngẫu nhiên trong bounds
- Website: https://github.com/manuelbieh/geolib
- Cài đặt: `npm install geolib`

#### 3. **Simple-statistics**
- Thư viện thống kê đơn giản
- Có thể dùng để tạo số ngẫu nhiên cho tọa độ
- GitHub: https://github.com/simple-statistics/simple-statistics

### Cho việc xử lý bản đồ nâng cao:

#### 4. **Mapbox GL JS**
- Thư viện bản đồ vector hiện đại
- Hiệu năng cao, nhiều tính năng
- Website: https://docs.mapbox.com/mapbox-gl-js/
- GitHub: https://github.com/mapbox/mapbox-gl-js

#### 5. **OpenLayers**
- Thư viện bản đồ mạnh mẽ, nhiều tính năng
- Phức tạp hơn Leaflet nhưng linh hoạt hơn
- Website: https://openlayers.org/
- GitHub: https://github.com/openlayers/openlayers

#### 6. **Google Maps JavaScript API**
- API chính thức từ Google
- Nhiều tính năng, cần API key
- Website: https://developers.google.com/maps/documentation/javascript

### Cho việc clustering markers:

#### 7. **Leaflet.markercluster**
- Plugin Leaflet để nhóm markers
- Hữu ích khi có nhiều điểm
- GitHub: https://github.com/Leaflet/Leaflet.markercluster

### Cho việc vẽ và tương tác:

#### 8. **Leaflet.draw**
- Plugin vẽ shapes trên bản đồ
- GitHub: https://github.com/Leaflet/Leaflet.draw

#### 9. **Turf.js** (đã đề cập)
- Tính toán khoảng cách, diện tích, buffer, v.v.

## Cách hoạt động

1. **Lấy bounds của vùng hiển thị**: Sử dụng `map.getBounds()` để lấy tọa độ 4 góc của màn hình hiện tại
2. **Tạo điểm ngẫu nhiên**: Sử dụng `Math.random()` để tạo tọa độ ngẫu nhiên trong khoảng bounds
3. **Hiển thị markers**: Sử dụng `react-leaflet` Marker component để hiển thị các điểm trên bản đồ

## Cấu trúc Code

```
src/
├── App.tsx          # Component chính với logic bản đồ
├── App.css          # Styling cho ứng dụng
└── index.css        # Global styles
```

## Tùy chỉnh

- Thay đổi số lượng điểm: Sửa số `10` trong hàm `generateRandomPoints()`
- Thay đổi ngưỡng zoom: Sửa điều kiện `mapZoom >= 10` trong `isZoomedIn`
- Thay đổi vị trí mặc định: Sửa `center` prop trong `MapContainer`

## License

MIT
