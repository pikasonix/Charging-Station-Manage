// src/lib/services/StationService.ts
import type { Station } from "./StationPinTool";

const API_HOST = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = `${API_HOST}/api/stations`;
const RESCUE_API_BASE = `${API_HOST}/api/admin/rescue-stations`;

export interface FilterParams {
    search?: string;
    status?: number;
    vehicleType?: 'CAR' | 'MOTORBIKE' | 'BICYCLE';
    connectorType?: 'TYPE1' | 'TYPE2' | 'CHADEMO' | 'CCS' | 'TESLA';
    stationType?: 'charging' | 'rescue' | 'all';
    page?: number;
    size?: number;
}

export class StationService {
    /** Lưu trạm mới vào backend */
    static async saveStation(station: Omit<Station, "id">): Promise<Station> {
        const res = await fetch(`${API_BASE}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(station),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Không thể lưu trạm: ${err}`);
        }

        return res.json();
    }

    /** Lấy tất cả các trạm (cả charging và rescue) */
    static async getAllStations(): Promise<Station[]> {
        const results: Station[] = [];

        // Fetch charging stations
        try {
            const res = await fetch(`${API_BASE}`);
            if (res.ok) {
                const data = await res.json();
                results.push(...this.processResponse(data));
            }
        } catch (e) {
            console.error("Error fetching charging stations:", e);
        }

        // Fetch rescue stations
        try {
            const rescueStations = await this.getRescueStations();
            results.push(...rescueStations);
        } catch (e) {
            console.error("Error fetching rescue stations:", e);
        }

        return results;
    }

    /** Lọc trạm theo nhiều tiêu chí (hỗ trợ cả charging và rescue) */
    static async filterStations(filters: FilterParams): Promise<Station[]> {
        const stationType = filters.stationType || 'all';

        // Build params for charging stations
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.status !== undefined) params.append('status', filters.status.toString());
        if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
        if (filters.connectorType) params.append('connectorType', filters.connectorType);
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());

        const results: Station[] = [];

        // Fetch charging stations if needed
        if (stationType === 'all' || stationType === 'charging') {
            try {
                const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    results.push(...this.processResponse(data));
                }
            } catch (e) {
                console.error("Error fetching charging stations:", e);
            }
        }

        // Fetch rescue stations if needed
        if (stationType === 'all' || stationType === 'rescue') {
            try {
                const rescueStations = await this.getRescueStations(filters.search);
                results.push(...rescueStations);
            } catch (e) {
                console.error("Error fetching rescue stations:", e);
            }
        }

        return results;
    }

    /** Lấy danh sách trạm cứu hộ */
    static async getRescueStations(search?: string): Promise<Station[]> {
        const params = new URLSearchParams();
        params.append('page', '0');
        params.append('size', '100');
        if (search) params.append('keyword', search);

        // Get auth token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${RESCUE_API_BASE}?${params}`, { headers });
        if (!res.ok) {
            console.warn("Could not fetch rescue stations");
            return [];
        }

        const data = await res.json();
        // API returns { data: { content: [...] } } structure
        const items = data?.data?.content || data?.content || [];
        return items.map((item: any) => this.mapRescueToStation(item));
    }

    /** Lấy trạm theo loại */
    static async getStationsByType(type: string): Promise<Station[]> {
        const res = await fetch(`${API_BASE}?type=${encodeURIComponent(type)}`);
        if (!res.ok) throw new Error("Không thể lấy trạm theo loại");
        const data = await res.json();
        return this.processResponse(data);
    }

    /** Lấy trạm trong vùng toạ độ */
    static async getStationsInBounds(bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    }): Promise<Station[]> {
        const query = new URLSearchParams({
            north: bounds.north.toString(),
            south: bounds.south.toString(),
            east: bounds.east.toString(),
            west: bounds.west.toString(),
        });
        const res = await fetch(`${API_BASE}/bounds?${query}`);
        if (!res.ok) throw new Error("Không thể lấy trạm trong khu vực");
        const data = await res.json();
        return this.processResponse(data);
    }

    /** Xử lý response từ API (hỗ trợ cả array và Page object) */
    private static processResponse(data: any): Station[] {
        const items = Array.isArray(data) ? data : (data.content || []);
        return items.map((item: any) => this.mapToStation(item));
    }

    /** Map dữ liệu từ Charging Station API sang model Station */
    private static mapToStation(item: any): Station {
        return {
            id: item.id?.toString(),
            name: item.name,
            type: "charging",
            lat: Number(item.latitude),
            lng: Number(item.longitude),
            description: item.address,
            contact: item.vendorName,
            openTime: item.openTime,
            closeTime: item.closeTime,
            ...item,
            rating: item.averageRating,
            status: item.status === 1 ? "Hoạt động" : "Bảo trì",
        };
    }

    /** Map dữ liệu từ Rescue Station API sang model Station */
    private static mapRescueToStation(item: any): Station {
        return {
            ...item,
            id: `rescue-${item.id}`, // Must be after spread to not be overwritten
            name: item.name,
            type: "rescue",
            lat: Number(item.location?.latitude || 0),
            lng: Number(item.location?.longitude || 0),
            description: `${item.location?.addressDetail || ''}, ${item.location?.province || ''}`,
            contact: item.phone,
            openTime: item.openTime,
            closeTime: item.closeTime,
            status: "Hoạt động", // Rescue stations are assumed active
        };
    }

    /** Cập nhật thông tin trạm */
    static async updateStation(id: string, updates: Partial<Station>): Promise<Station> {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error("Không thể cập nhật trạm");
        return res.json();
    }

    /** Xóa trạm */
    static async deleteStation(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa trạm");
    }

    /** Lấy chi tiết trạm theo ID (hỗ trợ cả charging và rescue) */
    static async getStationById(id: string): Promise<any> {
        // Check if this is a rescue station ID
        const idStr = String(id);
        if (idStr.startsWith('rescue-')) {
            const rescueId = idStr.replace('rescue-', '');
            return this.getRescueStationById(rescueId);
        }
        
        // Regular charging station
        const res = await fetch(`${API_BASE}/${id}`);
        if (!res.ok) throw new Error("Không thể lấy thông tin trạm");
        return res.json();
    }

    /** Lấy chi tiết trạm cứu hộ theo ID */
    static async getRescueStationById(id: string): Promise<any> {
        // Get auth token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Since backend doesn't have a single rescue station endpoint,
        // we fetch all and find the matching one
        const allRescue = await this.getRescueStations();
        
        // The id parameter is already stripped of 'rescue-' prefix
        // So we need to match it back
        const found = allRescue.find(s => {
            const stationId = s.id?.replace('rescue-', '');
            return stationId === id;
        });
        
        if (!found) {
            console.error('Rescue station not found. ID:', id, 'Available:', allRescue.map(s => s.id));
            throw new Error('Không tìm thấy trạm cứu hộ');
        }

        // Transform to match charging station detail format
        return {
            id: found.id,
            name: found.name,
            address: found.description,
            city: found.description?.split(',').pop()?.trim() || '',
            latitude: found.lat,
            longitude: found.lng,
            openTime: found.openTime,
            closeTime: found.closeTime,
            status: 1, // Active
            type: 'rescue',
            vendorName: 'Dịch vụ cứu hộ',
            averageRating: 0,
            totalRatings: 0,
            poles: [], // Rescue stations don't have charging poles
            contact: found.contact,
        };
    }

    /** Lấy danh sách đánh giá của trạm */
    static async getStationReviews(id: string, page: number = 0, size: number = 20): Promise<any[]> {
        // Rescue stations don't have reviews yet
        const idStr = String(id);
        if (idStr.startsWith('rescue-')) {
            return [];
        }
        
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        const res = await fetch(`${API_BASE}/${id}/reviews?${params}`);
        if (!res.ok) throw new Error("Không thể lấy đánh giá");
        const data = await res.json();
        return Array.isArray(data) ? data : (data.content || []);
    }

    /** Lấy danh sách trụ sạc của trạm */
    static async getStationPoles(id: string): Promise<any> {
        const idStr = String(id);
        if (idStr.startsWith('rescue-')) {
            return [];
        }
        
        const res = await fetch(`${API_BASE}/${id}/poles`);
        if (!res.ok) throw new Error("Không thể lấy danh sách trụ sạc");
        const data = await res.json();
        // API trả về BaseApiResponse<List<ChargingPoleResponse>>
        return data;
    }

    /** Tìm trạm gần nhất (client-side tính khoảng cách) */
    static async findNearestStations(
        lat: number,
        lng: number,
        type?: string,
        limit: number = 5
    ): Promise<Station[]> {
        const stations = type
            ? await this.getStationsByType(type)
            : await this.getAllStations();

        const stationsWithDistance = stations.map((station) => ({
            ...station,
            distance: this.calculateDistance(lat, lng, station.lat, station.lng),
        }));

        return stationsWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);
    }

    /** Tính khoảng cách giữa 2 điểm (Haversine formula) */
    private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(this.toRadians(lat1)) *
            Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
