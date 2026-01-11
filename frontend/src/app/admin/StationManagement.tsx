import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import {
  Zap,
  MapPin,
  Activity,
  Power,
  Eye,
  BatteryCharging
} from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- INTERFACES ---
interface Station {
  id: number;
  name: string;
  address: string;
  ports: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  revenue: number;
  poles: number;
}

// --- CONFIG ---
const API_BASE_URL = "http://localhost:8080/api/stations";

export default function StationManagement() {
  // --- STATE ---
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- HELPER: LẤY TOKEN (ĐÃ SỬA: LẤY ĐÚNG KEY 'authToken') ---
  const getToken = () => {
    // Ưu tiên lấy 'authToken' như trong ảnh bạn gửi
    return localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken') || "";
  };

  // --- FUNCTION 1: FETCH DATA ---
  const fetchStations = async () => {
    setIsLoading(true);
    try {
      const token = getToken();

      // Kiểm tra token
      if (!token) {
        console.error("Token không tồn tại trong LocalStorage (Cần key 'authToken')");
        toast.error("Vui lòng đăng nhập lại", { description: "Không tìm thấy phiên đăng nhập." });
        setIsLoading(false);
        return;
      }

      // Gọi API
      const response = await axios.get(`${API_BASE_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const rawData = response.data.content || response.data;
      console.log("Dữ liệu gốc từ Server:", rawData);
      // Lọc bỏ các item bị null hoặc undefined để tránh crash giao diện
      const cleanData = Array.isArray(rawData)
        ? rawData.filter((item: any) => item !== null && item !== undefined).map((item) => ({
            ...item,
            // Đảm bảo luôn là chữ in hoa, nếu null thì gán mặc định INACTIVE
            status: item.status2 || item.status || 'INACTIVE'
        }))
        : [];
      setStations(cleanData);


    } catch (error: any) {
      console.error("Lỗi tải trạm sạc:", error);

      if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          toast.error("Thiếu quyền truy cập (403)", { description: "Tài khoản không phải là ADMIN." });
        } else if (status === 401) {
          toast.error("Hết phiên đăng nhập (401)");
        } else {
          toast.error(`Lỗi hệ thống (${status})`);
        }
      } else {
        toast.error("Không thể kết nối đến Server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchStations();
  }, []);

  // --- FUNCTION 2: TOGGLE STATUS ---
  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const oldStations = [...stations];

    // Optimistic UI Update
    setStations(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));

    try {
      const token = getToken();
      await axios.patch(`${API_BASE_URL}/admin/${id}/status`, null, {
        params: { status: newStatus },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Đã cập nhật trạm #${id}`);
    } catch (error: any) {
      setStations(oldStations);
      toast.error("Cập nhật thất bại");
      console.error(error);
    }
  };

  const filteredStations = stations.filter(s => filterStatus === 'all' || s.status === filterStatus);

  // --- RENDER ---
  // ... (Giữ nguyên các import và logic fetch API như cũ)

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Responsive */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" /> Quản Lý Trạm Sạc
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px] bg-white shadow-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Vô hiệu hóa</SelectItem>
              <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        // ... (Giữ nguyên loading state)
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* ... (Giữ nguyên empty state) */}
          {filteredStations.length === 0 && (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
               <p className="text-gray-400 italic">Không tìm thấy trạm sạc nào.</p>
             </div>
          )}

          {filteredStations.map((station) => (
            <div key={station.id} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-md transition duration-200 gap-4">

              {/* Info section - Responsive layout */}
              <div className="flex items-start gap-4 w-full md:w-auto">
                <div className={`p-3 rounded-full flex-shrink-0 ${station.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                  <BatteryCharging className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg break-words">{station.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 mt-1 gap-2 sm:gap-4">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded text-gray-600 w-fit">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate max-w-[200px] md:max-w-xs">{station.address}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium text-blue-600 w-fit">
                      <Zap className="w-3.5 h-3.5" /> {station.ports} Cổng sạc
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions section - Full width on mobile */}
              <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 mt-1 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${station.status === 'ACTIVE'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : station.status === 'MAINTENANCE'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                  {station.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : station.status === 'MAINTENANCE' ? 'BẢO TRÌ' : 'ĐÃ TẮT'}
                </span>

                <div className="flex gap-1">
                  <button onClick={() => setSelectedStation(station)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button onClick={() => toggleStatus(station.id, station.status)} className={`p-2 rounded-lg transition ${station.status === 'ACTIVE' ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'
                    }`}>
                    <Power className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Responsive */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all">
            {/* ... (Giữ nguyên nội dung modal) */}
             <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{selectedStation.name}</h3>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-1 opacity-90">
                  <MapPin className="w-4 h-4" /> {selectedStation.address}
                </p>
              </div>
              <button onClick={() => setSelectedStation(null)} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Số Trụ Sạc </div>
                  <div className="font-bold text-gray-900 text-lg">{selectedStation.poles} Trụ</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Số Cổng Sạc</div>
                  <div className="font-bold text-gray-900 text-lg">{selectedStation.ports} Cổng</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Trạng thái kỹ thuật</label>
                <div className="flex items-center gap-2 text-sm text-gray-800 bg-green-50 p-3 rounded-lg border border-green-100">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Ngày kiểm tra cuối 12/12/2025</span>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end gap-2">
                <button onClick={() => setSelectedStation(null)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
