# Routing (Frontend) — Tài liệu kỹ thuật

## 1) Mục tiêu
Màn hình `/routing` cung cấp:
- Bản đồ Mapbox (client-only) để chọn điểm đi/đến/điểm qua
- Tính tuyến (routing) theo profile (driving/walking/cycling/driving-traffic)
- Hiển thị hướng dẫn từng bước (turn-by-turn) bằng tiếng Việt
- Hiển thị traffic/congestion trên tuyến (theo annotation)
- Guidance mode (theo GPS thật) và Simulation mode (giả lập chạy theo tuyến)
- Tích hợp danh sách trạm (charging/rescue), xem chi tiết, lọc, điều hướng

---

## 2) Entry point & kiến trúc
### 2.1 Entry route
- `frontend/src/app/routing/page.tsx`
  - Dùng `dynamic(() => import(...), { ssr: false })` để **tắt SSR** cho Mapbox GL.
  - Lý do: Mapbox GL cần `window/document` → SSR sẽ lỗi.

### 2.2 Component “root” của feature
- `frontend/src/components/routing/RoutingMap.tsx`
  - Đây là “orchestrator”: khởi tạo map, quản lý state routing + UI panels + stations + guidance/simulation.

---

## 3) Bản đồ, layer, source (Mapbox GL)
### 3.1 Map init
Trong `RoutingMap.tsx`:
- Tạo `mapboxgl.Map` trong `useEffect` khi mount
- Lắng nghe `load` và `style.load` để add sources/layers an toàn

### 3.2 Sources/Layers quan trọng
Các source id tiêu biểu:
- `routeSourceId = 'route-line'`: GeoJSON chứa tuyến
- `stepSourceId = 'step-line'`: GeoJSON chứa segment của step đang focus
- `congestionSourceId = 'congestion-line'`: GeoJSON chứa segments theo congestion

Các layer tiêu biểu:
- `route-line-casing`: viền/halo cho tuyến chính
- `route-line-layer`: tuyến chính
- `step-line-layer`: tuyến step đang chọn
- `congestion-line-layer`: tuyến tô màu theo congestion (đặt dưới `route-line-layer`)

### 3.3 Toggle hiển thị
- Traffic layer (nếu có) + congestion layer: được toggle qua UI
- 3D/angle: thay đổi pitch/bearing/camera (tùy logic trong map)

---

## 4) Luồng routing end-to-end
### 4.1 Input điểm đi/đến/điểm qua
Người dùng có thể:
- Search địa điểm (geocoding) trong `ControlsPanel.tsx`
- “Pick on map” (bấm trực tiếp lên map) thông qua picking mode trong `RoutingMap.tsx`
- Reorder waypoint bằng drag & drop (Dnd-kit) trong `ControlsPanel.tsx`

### 4.2 Calculate route
Luồng tiêu biểu:
1. User chọn start/end/waypoints + profile
2. `ControlsPanel` gọi `calculateRoute(advancedOptions?)`
3. `RoutingMap` gọi Directions API (Mapbox) và nhận response
4. `RoutingMap`:
   - set `routes` + `instructions`
   - dựng `routeDataRef` (GeoJSON) và `setData` vào source
   - dựng congestion segments (GeoJSON) và `setData` vào congestion source
   - set `routeSummary`, `annotationMetrics`
   - fit bounds / easeTo camera

### 4.3 Route alternatives
- `routes` có thể có nhiều tuyến (alternatives)
- `routeAlternatives` được tạo bằng `useMemo` để hiển thị tóm tắt (distance/duration/summary)
- User chọn tuyến → `selectedRouteIdx` đổi và map re-render tuyến tương ứng

---

## 5) Congestion/Traffic logic
### 5.1 Normalize congestion
Trong `RoutingMap.tsx` có pipeline:
- Parse `leg.annotation.congestion` (string) + `leg.annotation.congestion_numeric` (number)
- Nếu không đủ, dùng context (speed, maxspeed, duration, distance) để suy ra category

Category:
- `severe | heavy | moderate | low | unknown`

Màu sắc:
- mapping qua `CONGESTION_COLOR_MAP`

### 5.2 Annotation metrics
- `AnnotationMetrics` (định nghĩa trong `ControlsPanel.tsx`)
- Tổng hợp từ annotation arrays (duration/distance/speed/maxspeed/congestion)
- Fallback qua `primaryRoute.duration` và `primaryRoute.distance` nếu thiếu

---

## 6) Turn-by-turn (Instructions)
### 6.1 Format tiếng Việt
- `frontend/src/components/routing/formatters.ts`
  - `formatDistance(m)`
  - `formatDuration(minutes)`
  - `formatInstructionVI(step)`
  - `renderInstructionPopupHTML(step)` (tạo HTML cho popup, kèm icon + speed limit)

### 6.2 Maneuver icons
- `frontend/src/components/routing/maneuvers.ts`
  - Map từ `(maneuver.type + modifier)` → SVG URL
  - `pickManeuverIcon(step)` trả về `{ src, rotate }`

### 6.3 Guidance overlay
- `frontend/src/components/routing/GuidanceHUD.tsx`
  - Hiển thị step hiện tại, nút Next/Prev/Stop
  - Dùng `formatInstructionVI` + `pickManeuverIcon`

---

## 7) Guidance mode (GPS thật)
Trong `RoutingMap.tsx`:
- Dùng `navigator.geolocation.watchPosition` để nhận `{ latitude, longitude, heading }`
- Cập nhật marker “vehicle” và camera follow
- Nếu `heading` không có, dùng bearing của geometry step hiện tại
- Smooth turning bằng `stepBearingTowards(from, to, maxTurnRateDegPerSec * dt)`

**Điểm hay bị hỏi:**
- Quyền location trên browser
- Cleanup `watchPosition` khi tắt guidance/unmount
- Smoothing bearing để tránh giật

---

## 8) Simulation mode (giả lập)
### 8.1 UI
- `frontend/src/components/routing/SimulationPanel.tsx`
  - Điều khiển play/pause, speed (0.5x/1x/2x), follow
  - Hiển thị metric: còn lại, ETA, đến rẽ

### 8.2 Engine
Trong `RoutingMap.tsx`:
- Khi có route, tạo:
  - `simCoordsRef`: coords của tuyến
  - `simCumDistRef`: mảng cumulative distance
- Mỗi frame (RAF):
  - advance dist theo `baseSpeed * simSpeed * dt`
  - nội suy vị trí theo distance (`positionAtDistance`)
  - xoay marker theo bearing
  - cập nhật camera nếu follow
  - cập nhật metrics: remaining, ETA, distance-to-next-maneuver

### 8.3 Marker
- `frontend/src/components/routing/VehicleMarker.tsx`
  - `createVehicleMarkerElement(color)`
  - `updateVehicleMarkerElementColor(el, color)` để tô màu theo traffic/congestion

---

## 9) Stations (charging/rescue)
### 9.1 Service layer
- `frontend/src/components/routing/StationService.ts`
  - `API_HOST = NEXT_PUBLIC_API_URL || http://localhost:8080`
  - `API_BASE = /api/stations`
  - `RESCUE_API_BASE = /api/admin/rescue-stations`
  - Methods tiêu biểu: `getAllStations()`, `filterStations(filters)`, `saveStation(...)`, `getStationById(...)`, `getStationPoles(...)`, `getStationReviews(...)`...

### 9.2 List/filter UI
- `frontend/src/components/routing/StationFilter.tsx`
  - Sidebar (desktop) / bottom sheet (mobile)
  - Search + bộ lọc (status, vehicleType, connectorType, stationType)
  - Hỗ trợ add/edit/delete/navigate/detail

### 9.3 Add station on map
- `frontend/src/components/routing/StationPinTool.tsx`
  - Khi bật tool: đổi cursor crosshair + bắt map click
  - Click map → mở modal form → POST station lên backend

**Lưu ý quan trọng (có thể bị hỏi/soi):**
- `StationPinTool.tsx` đang POST vào `/api/v1/stations` trong khi `StationService.ts` dùng `/api/stations`.
  - Đây có thể là khác API version hoặc là inconsistency.
  - Nếu interview hỏi “tại sao add station không hiện/không đúng API?” → kiểm tra 2 endpoint này.

### 9.4 Marker & detail
- `frontend/src/components/routing/StationMarker.tsx`
  - `createStationMarkerElement(station, onClick)` tạo HTML marker
- `frontend/src/components/routing/StationDetailModal.tsx`
  - Load chi tiết station + review, nếu là charging station thì load poles
  - Tabs: info / poles / reviews

---

## 10) UI controls (desktop/mobile)
- `frontend/src/components/routing/ControlsPanel.tsx`
  - Panel chính cho routing input: start/end/waypoints
  - Geocoding suggestions (debounce)
  - Drag & drop reorder waypoints (@dnd-kit)
  - Route alternatives selection
  - Hiển thị danh sách instructions + metrics
  - Advanced options qua `AdvancedRoutingPanel`

- `frontend/src/components/routing/AdvancedRoutingPanel.tsx`
  - UI cho options nâng cao: alternatives, exclude, annotations, language, voice/banners, vehicle constraints...

- `frontend/src/components/routing/Toolbar.tsx`
  - Desktop toolbar: 3D, angle, traffic, congestion, rotate hold, reset north, pin my location...

- `frontend/src/components/routing/MobileHeader.tsx`
  - Mobile menu overlay (portal) chứa các toggle tương tự

- `frontend/src/components/routing/MobileLayerControl.tsx`
  - Popover nhanh để toggle layer/3D/angle

---

## 11) Utility modules
- `frontend/src/components/routing/geo.ts`
  - `computeBearing`, `distanceMeters`, `stepBearingTowards`, helpers normalize góc

- `frontend/src/components/routing/pinMarker.ts`
  - Tạo element marker cho start/end/via (phục vụ hiển thị)

---

## 12) Câu hỏi phỏng vấn (kèm hướng trả lời)
### A. Next.js / SSR
1) Vì sao `/routing` dùng `dynamic(..., { ssr: false })`?
- Mapbox GL dùng DOM APIs; SSR render trên server không có `window/document`.

2) Nếu bắt buộc SSR thì làm sao?
- Tách phần map sang client component, chỉ SSR wrapper; hoặc lazy load Mapbox; tránh gọi Mapbox trong server.

### B. Mapbox GL
3) Sự khác nhau giữa `source` và `layer`?
- Source là dữ liệu; layer là cách render; layer trỏ tới source.

4) Vì sao phải add sources/layers trong event `load`/`style.load`?
- Trước khi style load xong, add layer có thể fail; style reload cũng làm mất layer.

5) Tại sao dùng `useRef` cho `mapRef` thay vì `useState`?
- Object Mapbox là mutable, không cần trigger re-render; tránh render loop.

### C. Routing & annotations
6) Luồng lấy instructions từ Directions API?
- Response → legs → steps; set vào state để render list/HUD.

7) Congestion normalization hoạt động thế nào?
- Ưu tiên raw string, fallback numeric, nếu thiếu thì suy ra từ speed vs maxspeed hoặc speed threshold.

8) “maxspeed” annotation có format gì?
- Có thể là object `{value, unit, unknown}`; code có helper convert unit → m/s.

### D. Simulation / animation
9) Vì sao dùng `requestAnimationFrame`?
- Sync với refresh rate, tiết kiệm CPU, mượt hơn setInterval.

10) Làm sao tính vị trí xe theo quãng đường đã đi?
- Precompute cumulative distances; tìm segment chứa dist; nội suy linear.

11) Làm sao tránh camera giật khi rẽ?
- Interpolate bearing theo `maxTurnRateDegPerSec` (smooth turning).

### E. Stations
12) Stations load từ đâu? Có những loại nào?
- Charging từ `/api/stations`, rescue từ `/api/admin/rescue-stations`; UI filter `stationType`.

13) Nếu “Thêm trạm” không hiển thị ở list thì debug gì?
- Check endpoint mismatch (`/api/v1/stations` vs `/api/stations`), CORS, response shape, rồi refresh list.

### F. Performance & maintainability
14) Vì sao dùng `useMemo/useCallback`?
- Tránh re-render nặng (routes list, computations) và tránh tạo function mới liên tục.

15) Những rủi ro memory leak ở đây?
- Không cleanup `map.on`/`watchPosition`/RAF; popups/markers không remove.

---

## 13) Checklist trả lời nhanh khi bị hỏi “routing flow chạy thế nào?”
Bạn có thể trả lời theo 6 bước:
1) `/routing/page.tsx` load `RoutingMap` client-only
2) `RoutingMap` init Mapbox + add sources/layers
3) `ControlsPanel` thu thập start/end/waypoints + profile/options
4) `RoutingMap` gọi Directions API, set GeoJSON vào sources
5) Render instructions + congestion segments + route alternatives
6) Optional: guidance (GPS) hoặc simulation (RAF) để chạy theo tuyến
