'use client';
import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCreateReviewMutation } from '@/lib/redux/services/profileApi';

interface ReviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId?: number;
    stationId?: number;
    stationName?: string;
    onSubmitSuccess?: () => void;
}

export default function ReviewDialog({ 
    isOpen, 
    onClose, 
    sessionId, 
    stationId,
    stationName, 
    onSubmitSuccess 
}: ReviewDialogProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [createReview] = useCreateReviewMutation();

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.error("Vui lòng nhập nội dung đánh giá");
            return;
        }

        if (!stationId) {
            toast.error("Lỗi dữ liệu: Không tìm thấy ID trạm sạc. Vui lòng tải lại trang.");
            return;
        }
        if (!sessionId) {
            toast.error("Lỗi dữ liệu: Không tìm thấy ID phiên sạc. Vui lòng tải lại trang.");
            return;
        }

        setIsSubmitting(true);
        try {
            console.log("Submitting review with payload:", {
                targetType: 'STATION',
                targetId: stationId,
                sessionId: sessionId,
                stars: rating,
                comment: comment
            });

             await createReview({
                targetType: 'STATION',
                targetId: stationId,
                sessionId: sessionId,
                stars: rating,
                comment: comment
             }).unwrap();
            
            toast.success("Cảm ơn bạn đã đánh giá!");
            if (onSubmitSuccess) onSubmitSuccess();
            onClose();
        } catch (error: any) {
            console.error("Submit review error:", error);
            // Try to extract the most specific error message
            // 1. error.data.data.message (from ApiExceptionHandler built response)
            // 2. error.data.message (top level title/message)
            // 3. error.message (generic)
            const detailMsg = error?.data?.data?.message;
            const titleMsg = error?.data?.message;
            const errorMessage = detailMsg || titleMsg || error?.message || "Gửi đánh giá thất bại. Vui lòng thử lại.";
            
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Đánh giá phiên sạc</DialogTitle>
                    <DialogDescription>
                        Bạn cảm thấy trải nghiệm sạc tại {stationName || 'trạm này'} thế nào?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-all hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(null)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    size={32}
                                    className={`${
                                        star <= (hoveredStar ?? rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-100 text-gray-300"
                                    } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="text-center font-medium text-sm text-gray-600">
                        {rating === 5 && "Tuyệt vời!"}
                        {rating === 4 && "Rất tốt"}
                        {rating === 3 && "Tạm ổn"}
                        {rating === 2 && "Chưa hài lòng"}
                        {rating === 1 && "Tệ"}
                    </div>

                    {/* Comment Area */}
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Chia sẻ thêm về trải nghiệm của bạn (tốc độ sạc, không gian, thái độ nhân viên...)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Bỏ qua
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !comment.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                 Đang gửi...
                            </>
                        ) : (
                            "Gửi đánh giá"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
