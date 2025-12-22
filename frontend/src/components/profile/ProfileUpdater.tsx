"use client";

import { useEffect, useCallback } from "react";
import { useGetSessionQuery } from "@/lib/redux/services/auth";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "@/lib/redux/services/profileApi";

/**
 * Client component: tự động cập nhật profile người dùng (số điện thoại và avatar)
 * Không còn sử dụng Supabase.
 */
export default function ProfileUpdater() {
  const { data: sessionData } = useGetSessionQuery();
  const userId = sessionData?.user?.id;
  const [updateProfile] = useUpdateProfileMutation();
  const [uploadAvatar] = useUploadAvatarMutation();

  const handleMutationError = useCallback((err: unknown, context: string) => {
    console.error(`Failed to ${context}:`, err);
  }, []);

  /**
   * Nếu có pending phone trong localStorage thì gửi lên API backend
   */
  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;

    const pendingPhone = localStorage.getItem("pending-phone-update");
    if (pendingPhone) {
      updateProfile({ id: userId?.toString(), phone: pendingPhone })
        .unwrap()
        .then(() => {
          localStorage.removeItem("pending-phone-update");
        })
        .catch((err) => {
          handleMutationError(err, "update phone from local storage");
          localStorage.removeItem("pending-phone-update");
        });
    }
  }, [userId, updateProfile, handleMutationError]);

  /**
   * Nếu user đăng nhập bằng Google và chưa có avatar → sao chép avatar từ Google sang hệ thống backend
   */
  useEffect(() => {
    const copyGoogleAvatar = async () => {
      if (!userId) return;

      const googleAvatarUrl =
        sessionData?.user?.user_metadata?.avatar_url;
      if (!googleAvatarUrl) return;

      try {
        // Kiểm tra avatar hiện tại trong backend
        const API_HOST = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const profileRes = await fetch(`${API_HOST}/api/v1/profile/${userId}`);
        const profile = await profileRes.json();

        // Nếu đã có avatar thì không cần làm gì
        if (profile?.avatar_url) return;

        // Nếu chưa có → tải avatar từ Google và upload qua backend
        const response = await fetch(googleAvatarUrl);
        if (!response.ok) throw new Error("Failed to fetch Google avatar");

        const blob = await response.blob();
        const file = new File([blob], "avatar.jpg", { type: blob.type });

        // Gọi API upload avatar backend (sử dụng endpoint riêng)
        const uploadResponse = await uploadAvatar({ file }).unwrap();

        // Sau khi upload thành công → cập nhật URL vào profile
        await updateProfile({
          id: userId?.toString(),
          avatar_url: uploadResponse.publicUrl,
        }).unwrap();
      } catch (err) {
        handleMutationError(err, "copy Google avatar");
      }
    };

    copyGoogleAvatar();
  }, [
    userId,
    sessionData?.user?.user_metadata?.avatar_url,
    uploadAvatar,
    updateProfile,
    handleMutationError,
  ]);

  return null;
}
