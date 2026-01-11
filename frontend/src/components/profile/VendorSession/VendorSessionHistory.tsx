import React, { useState } from "react";
import { useGetVendorSessionHistoryQuery } from "@/lib/redux/services/profileApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const parseDateTime = (dateString: string) => {
  if (!dateString) return new Date();
  // Remove 'Z' if present to force local time interpretation
  const localDateString = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
  return new Date(localDateString);
};

export default function VendorSessionHistory() {
  const [page, setPage] = useState(0);
  const [date, setDate] = useState<Date>();
  // Simplified filter for demo
  const { data, isLoading } = useGetVendorSessionHistoryQuery({
    page,
    size: 10,
    from: date ? format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss") : undefined,
    to: date ? format(endOfDay(date), "yyyy-MM-dd'T'HH:mm:ss") : undefined,
  });

  const sessions = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lịch sử phiên sạc</h3>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Lọc theo ngày bắt đầu</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {date && <Button variant="ghost" onClick={() => setDate(undefined)}>Xóa</Button>}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian bắt đầu</TableHead>
                <TableHead>Trạm</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Năng lượng</TableHead>
                <TableHead>Tổng chi phí</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Đang tải...</TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Không tìm thấy lịch sử.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session: any) => (
                  <TableRow key={session.sessionId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(parseDateTime(session.startTime), "PP")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseDateTime(session.startTime), "p")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{session.stationName}</span>
                        <span className="text-xs text-muted-foreground">{session.connectorType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{session.customerName}</span>
                        <span className="text-xs text-muted-foreground">{session.licensePlate}</span>
                      </div>
                    </TableCell>
                    <TableCell>{session.energyKwh} kWh</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(session.cost)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.status === "COMPLETED" ? "default" : "destructive"}>
                        {session.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {page + 1} / {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data || data.data?.last || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
