import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "../store";

// ============================================
// Types for Backend API
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
  token?: string;
  user_metadata?: {
    avatar_url?: string;
  };
}

// ============================================
// Request Types
// ============================================

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "CUSTOMER" | "VENDOR";
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdateCustomerProfileRequest {
  userId: number;
  name: string;
  phone: string;
}

interface UpdateVendorProfileRequest {
  legalEntity: string;
  address: string;
  representative: string;
  verified?: boolean;
}

// ============================================
// Response Types
// ============================================

interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "VENDOR";
  message: string;
}

interface LoginResponse {
  token: string;
  type?: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
}

interface ValidationErrorResponse {
  message: string;
  error?: string;
  errors?: Record<string, string>;
}

interface AuthResponse {
  user: User | null;
  error?: string | null;
}

interface LogoutResponse {
  message: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

interface UserInfoResponse {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
}

interface UpdateProfileResponse {
  message: string;
  user: User;
}

// ============================================
// Type Guards for Error Handling
// ============================================

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error != null && "status" in error;
}

function isErrorWithData(
  error: unknown
): error is { status: number; data: ValidationErrorResponse } {
  return (
    isFetchBaseQueryError(error) &&
    typeof error.data === "object" &&
    error.data !== null &&
    ("message" in error.data || "error" in error.data)
  );
}

// ============================================
// API Service
// ============================================

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (body) => ({
        url: "/api/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: LoginResponse) => {
        return response;
      },
      transformErrorResponse: (response: FetchBaseQueryError) => {
        return response;
      },
      invalidatesTags: ["Auth", "User"],
    }),

    signup: builder.mutation<RegisterResponse, SignupCredentials>({
      query: (body) => ({
        url: "/api/auth/register",
        method: "POST",
        body,
      }),
      transformErrorResponse: (
        response: FetchBaseQueryError | { status: number; data: unknown }
      ) => {
        if (
          "status" in response &&
          response.status === 400 &&
          typeof response.data === "object" &&
          response.data !== null
        ) {
          return {
            status: response.status,
            data: response.data as ValidationErrorResponse,
          };
        }
        return response;
      },
      invalidatesTags: ["Auth", "User"],
    }),

    /** 📧 Forgot Password - Gửi email reset */
    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/api/auth/forgot-password',
        method: 'POST',
        body,
      }),
      transformErrorResponse: (response: any) => {
        // Backend trả về { error: "message" } hoặc { message: "..." }
        if (response.data) {
          return {
            status: response.status,
            data: {
              message: response.data.error || response.data.message || 'Có lỗi xảy ra'
            }
          };
        }
        return response;
      },
    }),
    
    /** 🔐 Reset Password - Đặt lại mật khẩu với token */
    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      query: (body) => ({
        url: '/api/auth/reset-password',
        method: 'POST',
        body,
      }),
      transformErrorResponse: (response: any) => {
        // Backend trả về { error: "message" }
        if (response.data) {
          return {
            status: response.status,
            data: {
              message: response.data.error || response.data.message || 'Có lỗi xảy ra'
            }
          };
        }
        return response;
      },
    }),

    /** 🚪 Logout */
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // Continue even if API call fails
        } finally {
          // Clear all tokens
          localStorage.removeItem("authToken");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          
          // Reset the entire auth API cache
          dispatch(authApi.util.resetApiState());
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    /** 🧑 Get current session using JWT token */
    getSession: builder.query<AuthResponse, void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        // Try server session first
        const result = await fetchWithBQ({ url: "/api/auth/me", method: "GET" });
        
        if (result.error) {
          // Fallback to localStorage
          const storedUser = localStorage.getItem("user");
          const storedToken = localStorage.getItem("authToken");
          
          if (storedUser && storedToken) {
            try {
              const parsedUser = JSON.parse(storedUser) as User;
              return {
                data: { user: { ...parsedUser, token: storedToken }, error: null },
              };
            } catch (e) {
              console.error("Failed to parse stored user:", e);
            }
          }
          return { error: result.error as FetchBaseQueryError };
        }

        // Map server response
        const resp = result.data as UserInfoResponse | null;
        if (resp && resp.id) {
          return {
            data: {
              user: {
                id: resp.id,
                name: resp.name,
                email: resp.email,
                phone: resp.phone,
                role: resp.role,
              },
              error: null,
            },
          };
        }

        // Fallback to localStorage
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("authToken");
        
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser) as User;
            return {
              data: { user: { ...parsedUser, token: storedToken }, error: null },
            };
          } catch (e) {
            console.error("Failed to parse stored user:", e);
          }
        }
        
        return { data: { user: null, error: null } };
      },
      providesTags: ["Auth"],
    }),

    /** 👤 Get current user from localStorage */
    getCurrentUser: builder.query<User | null, void>({
      queryFn: () => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser) as User;
            return { data: parsedUser };
          } catch (error) {
            console.error("Failed to parse stored user:", error);
            return { data: null };
          }
        }
        return { data: null };
      },
      providesTags: ["User"],
    }),

    /** 📝 Update customer profile */
    updateCustomerProfile: builder.mutation<UpdateProfileResponse, UpdateCustomerProfileRequest>({
      query: ({ userId, ...body }) => ({
        url: `/api/customer/${userId}`,
        method: "PUT",
        body,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        } catch (error) {
          console.error("Failed to update customer profile:", error);
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    /** 📝 Update vendor profile */
    updateVendorProfile: builder.mutation<UpdateProfileResponse, UpdateVendorProfileRequest>({
      query: (body) => ({
        url: "/api/vendor/profile",
        method: "PUT",
        body,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        } catch (error) {
          console.error("Failed to update vendor profile:", error);
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

// ------------------------------------------------------------------
// Lightweight baseQueryWithReauth for use by other RTK Query services
// Exports a wrapper around fetchBaseQuery that attaches the auth
// token from localStorage and provides a simple 401 handling path.
// ------------------------------------------------------------------
const _baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  prepareHeaders: (headers) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (e) {
      // ignore when localStorage not available
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const result = await _baseQuery(args, api, extraOptions);
  // If unauthorized, clear token so consumers can handle unauthenticated flows.
  if (result?.error && (result.error as any).status === 401) {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
      }
    } catch (e) {
      // ignore
    }
  }
  return result;
};

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useGetSessionQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetCurrentUserQuery,
  useUpdateCustomerProfileMutation,
  useUpdateVendorProfileMutation,
} = authApi;

// ============================================
// Export types
// ============================================

export type {
  User,
  LoginCredentials,
  SignupCredentials,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RegisterResponse,
  LoginResponse,
  ValidationErrorResponse,
  AuthResponse,
  LogoutResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  UpdateCustomerProfileRequest,
  UpdateVendorProfileRequest,
  UpdateProfileResponse,
};

export { isFetchBaseQueryError, isErrorWithData };