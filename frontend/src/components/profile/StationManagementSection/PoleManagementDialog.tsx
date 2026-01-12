"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Plus } from "lucide-react";
import { 
  useCreateChargingPoleMutation, 
  useUpdateChargingPoleMutation, 
  ChargingPole 
} from "@/lib/redux/services/stationApi";

interface PoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationId: number;
  poleToEdit?: ChargingPole | null;
}

export function PoleManagementDialog({ 
  open, 
  onOpenChange, 
  stationId, 
  poleToEdit 
}: PoleManagementDialogProps) {
  
  // State form
  const [formData, setFormData] = useState({
    manufacturer: "",
    maxPower: 11,
    maxConnectors: 2, // Mặc định 2 súng
    installDate: new Date().toISOString().split("T")[0],
  });

  // API Hooks
  const [createPole, { isLoading: isCreating }] = useCreateChargingPoleMutation();
  const [updatePole, { isLoading: isUpdating }] = useUpdateChargingPoleMutation();

  const isLoading = isCreating || isUpdating;

  // Effect: Reset form hoặc điền dữ liệu khi mở dialog
  useEffect(() => {
    if (open) {
      if (poleToEdit) {
        // --- CHẾ ĐỘ SỬA ---
        setFormData({
          manufacturer: poleToEdit.manufacturer,
          maxPower: poleToEdit.maxPower,
          // Ép kiểu as any để tránh lỗi TS nếu interface chưa kịp cập nhật
          maxConnectors: (poleToEdit as any).maxConnectors || 2,
          installDate: poleToEdit.installDate || new Date().toISOString().split("T")[0],
        });
      } else {
        // --- CHẾ ĐỘ THÊM MỚI (Reset form) ---
        setFormData({
          manufacturer: "",
          maxPower: 11,
          maxConnectors: 2, // Reset về 2
          installDate: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, poleToEdit]);

  const handleSubmit = async () => {
    // 1. Validate Form
    if (!formData.manufacturer.trim()) {
      toast.error("Vui lòng nhập tên hãng sản xuất");
      return;
    }
    if (formData.maxPower <= 0) {
      toast.error("Công suất phải lớn hơn 0");
      return;
    }
    if (formData.maxConnectors <= 0) {
      toast.error("Số lượng súng sạc phải lớn hơn 0");
      return;
    }

    try {
      if (poleToEdit) {
        // === GỌI API CẬP NHẬT ===
        await updatePole({
          id: poleToEdit.id,
          body: {
            manufacturer: formData.manufacturer,
            maxPower: Number(formData.maxPower),
            maxConnectors: Number(formData.maxConnectors),
            installDate: formData.installDate,
            connectors: poleToEdit.connectors || []
          }
        }).unwrap();
        toast.success("Cập nhật thông tin thành công");
      } else {
        // === GỌI API THÊM MỚI ===
        await createPole({
          stationId: stationId,
          manufacturer: formData.manufacturer,
          maxPower: Number(formData.maxPower),
          maxConnectors: Number(formData.maxConnectors),
          installDate: formData.installDate,
        }).unwrap();
        toast.success("Thêm trụ sạc thành công");
      }

      // Đóng dialog sau khi thành công
      onOpenChange(false);
    } catch (error: any) {
      console.error("Lỗi submit:", error);
      toast.error(error?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {poleToEdit ? "Cập nhật trụ sạc" : "Thêm trụ sạc mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          {/* Hãng sản xuất */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Hãng SX</Label>
            <Input
              className="col-span-3"
              placeholder="Ví dụ: ABB, Siemens..."
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            />
          </div>

          {/* Công suất tối đa */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Max (kW)</Label>
            <Input
              type="number"
              className="col-span-3"
              value={formData.maxPower}
              onChange={(e) => setFormData({ ...formData, maxPower: Number(e.target.value) })}
            />
          </div>

          {/* Số lượng súng sạc (Max Connectors) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Số cổng sạc</Label>
            <Input
              type="number"
              className="col-span-3"
              placeholder="VD: 2"
              value={formData.maxConnectors}
              onChange={(e) => setFormData({ ...formData, maxConnectors: Number(e.target.value) })}
            />
          </div>

          {/* Ngày lắp đặt */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Ngày lắp</Label>
            <Input
              type="date"
              className="col-span-3"
              value={formData.installDate}
              onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : poleToEdit ? (
              <Save className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {poleToEdit ? "Lưu thay đổi" : "Thêm mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}