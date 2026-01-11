'use client';
import React, { useEffect, useState } from "react";
import { Zap, Clock, Battery, AlertTriangle } from "lucide-react";
import { useGetCurrentSessionQuery, useStopSessionMutation, useGetSessionHistoryQuery, useGetActiveSessionsQuery } from "@/lib/redux/services/sessionApi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReviewDialog from "@/components/profile/MyReviewsSection/ReviewDialog";

// ... (imports remain matching)

export default function ChargingMonitor() {
    const { data: session, refetch, isLoading, isError } = useGetCurrentSessionQuery(undefined, {
        pollingInterval: 5000,
    });

    // Debug for current session
    console.log("ChargingMonitor Current Session Debug:", { session, isLoading, isError });

    const [stopSession, { isLoading: isStopping }] = useStopSessionMutation();
    const [elapsedTime, setElapsedTime] = useState(0);

    const isCharging = session?.status === 'CHARGING';

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCharging && session?.startTime) {
            const start = new Date(session.startTime).getTime();
            // Initial set
            const now = new Date().getTime();
            setElapsedTime(Math.floor((now - start) / 1000));

            interval = setInterval(() => {
                const currentNow = new Date().getTime();
                setElapsedTime(Math.floor((currentNow - start) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isCharging, session?.startTime]);

    const formatTime = (seconds: number) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [completedSession, setCompletedSession] = useState<any | null>(null);

    const handleStop = async () => {
        if (!session) return;

        const idToStop = session.sessionId;
        console.log("[ChargingMonitor] Stopping session ID:", idToStop);

        if (!idToStop) {
            toast.error("Lỗi: Không tìm thấy ID phiên sạc.");
            return;
        }

        try {
            const result = await stopSession(idToStop).unwrap();
            console.log("[ChargingMonitor] Stop result:", result);
            setCompletedSession(result);
            setShowReviewDialog(true);
            toast.success("Đã kết thúc phiên sạc!");
            refetch();
        } catch (error: any) {
            console.error("[ChargingMonitor] Stop session error:", error);
            const msg = error?.data?.message || error?.message || "Không thể dừng sạc. Vui lòng thử lại.";
            toast.error(`Lỗi: ${msg}`);
        }
    };

    if (isLoading) return null; // Or a small spinner if preferred
    if (isError) return null; // Or show error toast

    // Logic to keep component mounted if we need to show review dialog
    const shouldRender = (isCharging && session) || (showReviewDialog && completedSession);
    if (!shouldRender) return null;

    const displaySession = session || completedSession;
    if (!displaySession) return null;

    return (
        <div className="w-full bg-white rounded-lg shadow-sm border border-rose-200 p-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                        <div className="relative bg-rose-500 rounded-full p-1.5 text-white">
                            <Zap size={16} className="fill-current" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Đang sạc...</h3>
                        {(displaySession.vehicleBrand || displaySession.licensePlate) && (
                            <p className="text-xs text-rose-600 font-medium truncate max-w-[150px]">
                                {displaySession.vehicleBrand} {displaySession.vehicleModel} - {displaySession.licensePlate}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    #ID: {displaySession.sessionId}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                        <Clock size={12} /> Thời gian
                    </div>
                    <div className="font-mono font-bold text-lg text-rose-600">
                        {formatTime(elapsedTime)}
                    </div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                        <Battery size={12} /> Điện năng
                    </div>
                    <div className="font-mono font-bold text-lg text-rose-600">
                        {displaySession.energyKwh} kWh
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Chi phí tạm tính:</span>
                    <span className="font-bold text-gray-900">{displaySession.cost?.toLocaleString()} VNĐ</span>
                </div>
                {!showReviewDialog && (
                    <Button
                        variant="destructive"
                        className="w-full bg-rose-600 hover:bg-rose-700"
                        onClick={handleStop}
                        disabled={isStopping}
                    >
                        {isStopping ? "Đang dừng..." : "Dừng sạc"}
                    </Button>
                )}
            </div>

            <ReviewDialog
                isOpen={showReviewDialog}
                onClose={() => {
                    setShowReviewDialog(false);
                    setCompletedSession(null);
                }}
                sessionId={displaySession.sessionId}
                stationId={displaySession.stationId}
                stationName={displaySession.stationName}
            />
        </div>
    );
}

// Removed ActiveSessionCard component as it is no longer used
