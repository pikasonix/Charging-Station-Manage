import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// ============================================
// Types
// ============================================

export interface Connector {
    id: number;
    poleId: number;
    poleName?: string;
    stationId?: number;
    stationName?: string;
    connectorType: "TYPE_1" | "TYPE_2" | "CCS1" | "CCS2" | "CHADEMO" | "GB_T";
    maxPower: number;
    status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateConnectorRequest {
    poleId: number;
    connectorType: "TYPE_1" | "TYPE_2" | "CCS1" | "CCS2" | "CHADEMO" | "GB_T";
    maxPower: number;
    status?: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
}

export interface UpdateConnectorRequest {
    connectorType?: "TYPE_1" | "TYPE_2" | "CCS1" | "CCS2" | "CHADEMO" | "GB_T";
    maxPower?: number;
    status?: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
}

export interface UpdateConnectorStatusRequest {
    status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
}

export interface ConnectorSearchParams {
    poleId?: number;
    stationId?: number;
    connectorType?: string;
    status?: string;
    page?: number;
    size?: number;
}

export interface ConnectorPage {
    content: Connector[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

// ============================================
// API Definition
// ============================================

export const connectorApi = createApi({
    reducerPath: "connectorApi",
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("authToken");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["Connector"],
    endpoints: (builder) => ({
        // Lấy danh sách tất cả connectors
        getAllConnectors: builder.query<Connector[], void>({
            query: () => "/api/vendor/connectors",
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: "Connector" as const, id })),
                          { type: "Connector", id: "LIST" },
                      ]
                    : [{ type: "Connector", id: "LIST" }],
        }),

        // Tìm kiếm connectors với filter
        searchConnectors: builder.query<ConnectorPage, ConnectorSearchParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params.poleId) queryParams.append("poleId", params.poleId.toString());
                if (params.stationId) queryParams.append("stationId", params.stationId.toString());
                if (params.connectorType) queryParams.append("connectorType", params.connectorType);
                if (params.status) queryParams.append("status", params.status);
                if (params.page !== undefined) queryParams.append("page", params.page.toString());
                if (params.size !== undefined) queryParams.append("size", params.size.toString());
                
                return `/api/vendor/connectors/search?${queryParams.toString()}`;
            },
            providesTags: (result) =>
                result && result.content
                    ? [
                          ...result.content.map(({ id }) => ({ type: "Connector" as const, id })),
                          { type: "Connector", id: "LIST" },
                      ]
                    : [{ type: "Connector", id: "LIST" }],
        }),

        // Lấy chi tiết connector
        getConnectorById: builder.query<Connector, number>({
            query: (id) => `/api/vendor/connectors/${id}`,
            providesTags: (result, error, id) => [{ type: "Connector", id }],
        }),

        // Tạo connector mới
        createConnector: builder.mutation<Connector, CreateConnectorRequest>({
            query: (data) => ({
                url: "/api/vendor/connectors",
                method: "POST",
                body: data,
            }),
            invalidatesTags: [{ type: "Connector", id: "LIST" }],
        }),

        // Cập nhật connector
        updateConnector: builder.mutation<Connector, { id: number; data: UpdateConnectorRequest }>({
            query: ({ id, data }) => ({
                url: `/api/vendor/connectors/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Connector", id },
                { type: "Connector", id: "LIST" },
            ],
        }),

        // Cập nhật trạng thái connector
        updateConnectorStatus: builder.mutation<Connector, { id: number; status: string }>({
            query: ({ id, status }) => ({
                url: `/api/vendor/connectors/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Connector", id },
                { type: "Connector", id: "LIST" },
            ],
        }),

        // Xóa connector
        deleteConnector: builder.mutation<void, number>({
            query: (id) => ({
                url: `/api/vendor/connectors/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Connector", id: "LIST" }],
        }),
    }),
});

export const {
    useGetAllConnectorsQuery,
    useSearchConnectorsQuery,
    useGetConnectorByIdQuery,
    useCreateConnectorMutation,
    useUpdateConnectorMutation,
    useUpdateConnectorStatusMutation,
    useDeleteConnectorMutation,
} = connectorApi;