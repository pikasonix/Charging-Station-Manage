'use client';

import React from "react";
import { Star } from "lucide-react";
import { useGetMyReviewsQuery, ReviewResponse } from "@/lib/redux/services/profileApi";
import { Loader2 } from "lucide-react";

export interface ReviewItem {
    id: string;
    title: string;
    comment: string;
    rating: number;
    createdAt: string;
    location?: string;
}

interface MyReviewsSectionProps {
    reviews?: ReviewItem[];
}





const MyReviewsSection: React.FC<MyReviewsSectionProps> = () => {
    const { data, isLoading, isError } = useGetMyReviewsQuery({ page: 0, size: 20 });
    
    // Map API response to Component's ReviewItem structure
    const reviewList: ReviewItem[] = (data?.content || []).map((item: ReviewResponse) => ({
        id: item.id.toString(),
        title: item.targetName || "Trạm sạc",
        comment: item.comment,
        rating: item.stars,
        createdAt: item.createdAt,
        location: item.targetAddress,
    }));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (isError) {
         return (
            <div className="text-center py-12 text-red-500">
                Không thể tải danh sách đánh giá. Vui lòng thử lại sau.
            </div>
        );
    }

    if (reviewList.length === 0) {
        return (
             <div className="text-center py-12 text-gray-500">
                Bạn chưa có đánh giá nào.
            </div>
        );
    }

    return (
        <section className="space-y-6" aria-labelledby="my-reviews-section">
            <div className="flex flex-col gap-3">
                <h2 id="my-reviews-section" className="text-xl font-semibold text-gray-900">
                    Đánh giá của tôi
                </h2>
                <p className="text-sm text-gray-600 max-w-3xl">
                    Xem lại các bình luận và điểm số bạn đã gửi cho trạm sạc.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewList.map((review) => (
                    <article
                        key={review.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-3"
                    >
                        <header className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900 line-clamp-1" title={review.title}>{review.title}</h3>
                            <Rating rating={review.rating} />
                        </header>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{review.comment}</p>
                        <footer className="text-xs text-gray-500 flex items-center justify-between">
                            <span>{formatVietnameseDate(review.createdAt)}</span>
                            {review.location && <span className="max-w-[150px] truncate" title={review.location}>{review.location}</span>}
                        </footer>
                    </article>
                ))}
            </div>
        </section>
    );
};

const Rating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
            <Star
                key={index}
                className={`size-4 ${index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
            />
        ))}
        <span className="text-sm font-medium text-gray-800">{rating.toFixed(1)}</span>
    </div>
);

const formatVietnameseDate = (isoString: string) => {
    const formatter = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    return formatter.format(new Date(isoString));
};

export default MyReviewsSection;
