import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

export interface Session {
    sessionId: number;
    startTime: string; // ISO string
    endTime: string | null;
    status: 'CHARGING' | 'COMPLETED' | 'PENDING';
    energyKwh: number;
    cost: number;

    // Flattened info from Backend DTO
    stationId?: number;
    stationName?: string;
    stationAddress?: string;

    vehicleId?: number;
    licensePlate?: string;
    vehicleBrand?: string;
    vehicleModel?: string;

    connectorId?: number;
    connectorType?: string;
    maxPower?: number;
}

export const sessionApi = createApi({
    reducerPath: 'sessionApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/sessions`,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Session'],
    endpoints: (builder) => ({
        // Start a new session
        startSession: builder.mutation<Session, { connectorId: number; vehicleId: number }>({
            query: (body) => ({
                url: '/start',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Session'],
        }),
        // Stop a session
        stopSession: builder.mutation<Session, number>({
            query: (sessionId) => ({
                url: `/stop/${sessionId}`,
                method: 'POST',
            }),
            invalidatesTags: ['Session'],
        }),
        // Get current active session
        getCurrentSession: builder.query<Session, void>({
            query: () => '/current',
            providesTags: ['Session'],
        }),
        // Get all active sessions
        getActiveSessions: builder.query<Session[], void>({
            query: () => '/active',
            providesTags: ['Session'],
            keepUnusedDataFor: 0, // Force refresh
        }),
        // Get session history
        getSessionHistory: builder.query<any, { page: number; size: number }>({
            query: ({ page, size }) => `/history?page=${page}&size=${size}`,
            providesTags: ['Session'],
        }),
    }),
});

export const {
    useStartSessionMutation,
    useStopSessionMutation,
    useGetCurrentSessionQuery,
    useGetActiveSessionsQuery,
    useGetSessionHistoryQuery,
} = sessionApi;
