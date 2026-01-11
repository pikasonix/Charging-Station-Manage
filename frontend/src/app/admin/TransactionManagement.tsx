"use client";

import { useState } from 'react';
import {
  Search, Filter, Calendar, CreditCard, User, Building, Banknote,
  ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle, Clock,
  Shield, X
} from "lucide-react";
import {
  useGetTransactionsQuery,
  TransactionFilterParams
} from "@/lib/redux/services/adminApi";

export default function TransactionManagement() {
  // State quản lý Filters
  const [filters, setFilters] = useState<TransactionFilterParams>({
    page: 0,
    size: 10,
    customerId: undefined,
    stationId: undefined,
    paymentStatus: undefined,
    paymentMethod: undefined,
    paymentTimeFrom: undefined,
    paymentTimeTo: undefined,
    amountFrom: undefined,
    amountTo: undefined,
    customerName: '',
    stationName: ''
  });

  // State UI
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Redux API Hooks
  const { data: transactionsData, isLoading, isFetching } = useGetTransactionsQuery(filters);

  const transactions = transactionsData?.content || [];
  const totalPages = transactionsData?.totalPages || 0;

  // Handlers
  const handleFilterChange = (key: keyof TransactionFilterParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: any = {
      'PAID': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Thành công'
      },
      'PENDING': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-3 h-3" />,
        label: 'Đang xử lý'
      },
      'FAILED': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />,
        label: 'Thất bại'
      },
      'REFUNDED': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Banknote className="w-3 h-3" />,
        label: 'Hoàn tiền'
      },
      'CANCELLED': {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <XCircle className="w-3 h-3" />,
        label: 'Đã hủy'
      }
    };

    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: null,
      label: status
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 w-fit ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig: any = {
      'BANK_TRANSFER': { color: 'bg-blue-50 text-blue-700', label: 'Chuyển khoản' },
      'CREDIT_CARD': { color: 'bg-purple-50 text-purple-700', label: 'Thẻ tín dụng' },
      'E_WALLET': { color: 'bg-green-50 text-green-700', label: 'Ví điện tử' },
      'CASH': { color: 'bg-yellow-50 text-yellow-700', label: 'Tiền mặt' },
      'SYSTEM': { color: 'bg-gray-50 text-gray-700', label: 'Hệ thống' }
    };

    const config = methodConfig[method] || { color: 'bg-gray-50 text-gray-700', label: method };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color} whitespace-nowrap`}>
        {config.label}
      </span>
    );
  };


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. Header Page Responsive */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-600" /> Quản Lý Giao Dịch
          </h2>
          <p className="text-sm text-gray-500 mt-1">Theo dõi và quản lý tất cả các giao dịch thanh toán trên hệ thống.</p>
        </div>
      </div>

      {/* 2. Filter Bar Responsive: Stack dọc trên mobile */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">

          <div className="w-full md:flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tên khách hàng, mã giao dịch..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                value={filters.customerName || ''}
                onChange={(e) => handleFilterChange('customerName', e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-[180px]">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Trạng thái</label>
            <select
              className="w-full py-2 px-3 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              value={filters.paymentStatus || ''}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value || undefined)}
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="PAID">Thành công</option>
              <option value="FAILED">Thất bại</option>
              <option value="REFUNDED">Hoàn tiền</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="w-full md:w-[180px]">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Phương thức</label>
            <select
              className="w-full py-2 px-3 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              value={filters.paymentMethod || ''}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value || undefined)}
            >
              <option value="">Tất cả</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
              <option value="CREDIT_CARD">Thẻ tín dụng</option>
              <option value="E_WALLET">Ví điện tử</option>
              <option value="CASH">Tiền mặt</option>
            </select>
          </div>

          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="w-full md:w-auto px-4 py-2 border rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            <Filter className="w-4 h-4" />
            <span className="md:hidden lg:inline">Bộ lọc nâng cao</span>
          </button>
        </div>

        {/* Advanced Filter Responsive Grid */}
        {showAdvancedFilter && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Lọc nâng cao
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ngày thanh toán từ</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 border rounded text-sm bg-white"
                  onChange={(e) => handleFilterChange('paymentTimeFrom', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ngày thanh toán đến</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 border rounded text-sm bg-white"
                  onChange={(e) => handleFilterChange('paymentTimeTo', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Số tiền từ</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full p-2 border rounded text-sm"
                  onChange={(e) => handleFilterChange('amountFrom', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Số tiền đến</label>
                <input
                  type="number"
                  placeholder="1000000"
                  className="w-full p-2 border rounded text-sm"
                  onChange={(e) => handleFilterChange('amountTo', Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Tên trạm</label>
                <input
                  type="text"
                  placeholder="Nhập tên trạm"
                  className="w-full p-2 border rounded text-sm"
                  value={filters.stationName || ''}
                  onChange={(e) => handleFilterChange('stationName', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Table List Responsive: Scroll ngang với min-w */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          {/* min-w-[1000px] để bảng không bị co lại quá nhỏ */}
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
              <tr>
                <th className="p-4">Thông tin giao dịch</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Trạng thái & Phương thức</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Không tìm thấy giao dịch nào
                  </td>
                </tr>
              ) : (
                transactions.map((transaction: any) => (
                  <tr key={transaction.transactionId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          Mã GD: <span className="font-mono">#{transaction.transactionId}</span>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(transaction.paymentTime)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[200px]">
                          <Building className="w-3 h-3 flex-shrink-0" />
                          {transaction.stationName || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium truncate max-w-[150px]">{transaction.customerName || 'N/A'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: #{transaction.customerId || 'N/A'}
                        </div>
                        {transaction.customerPhone && (
                          <div className="text-xs text-gray-500">
                            {transaction.customerPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div>
                          {getPaymentStatusBadge(transaction.paymentStatus)}
                        </div>
                        <div>
                          {getPaymentMethodBadge(transaction.paymentMethod)}
                        </div>
                        {transaction.bankName && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 truncate max-w-[150px]">
                            <Banknote className="w-3 h-3" />
                            {transaction.bankName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green-600 text-lg whitespace-nowrap">
                        {formatCurrency(transaction.amount || 0)}
                      </div>
                      {transaction.sessionId && (
                        <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                          Phiên sạc: #{transaction.sessionId}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition inline-flex justify-center"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Responsive */}
        {totalPages > 0 && (
          <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
              Hiển thị {transactions.length} giao dịch •
              Tổng tiền: {formatCurrency(transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0))}
            </div>
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center">
              <button
                disabled={filters.page === 0}
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 0) - 1 }))}
                className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 flex items-center bg-white border rounded">
                Trang {(filters.page || 0) + 1} / {totalPages}
              </span>
              <button
                disabled={(filters.page || 0) + 1 >= totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 0) + 1 }))}
                className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 hover:bg-gray-100 flex items-center gap-1"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal Detail Responsive: Grid 1 cột trên mobile */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

            {/* Header Sticky */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 md:p-6 text-white flex justify-between items-start sticky top-0 z-10">
              <div className="pr-4">
                <h3 className="text-lg md:text-xl font-bold">Chi tiết giao dịch #{selectedTransaction.transactionId}</h3>
                <p className="text-purple-100 text-xs md:text-sm mt-1">
                  Mã GD: <span className="font-mono">{selectedTransaction.transactionId}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Thông tin chính: Grid 1 col mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase mb-1 font-semibold">
                    <User className="w-3 h-3" /> Khách hàng
                  </div>
                  <div className="text-gray-900 font-medium truncate">{selectedTransaction.customerName || 'N/A'}</div>
                  <div className="text-sm text-gray-500 mt-1 break-all">
                    {selectedTransaction.customerEmail && (
                      <div>{selectedTransaction.customerEmail}</div>
                    )}
                    {selectedTransaction.customerPhone && (
                      <div>{selectedTransaction.customerPhone}</div>
                    )}
                    <div>ID: #{selectedTransaction.customerId || 'N/A'}</div>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase mb-1 font-semibold">
                    <Building className="w-3 h-3" /> Trạm sạc
                  </div>
                  <div className="text-gray-900 font-medium truncate">{selectedTransaction.stationName || 'N/A'}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    <div className="truncate">{selectedTransaction.stationAddress || 'N/A'}</div>
                    <div className="truncate">Vendor: {selectedTransaction.vendorName || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Thông tin thanh toán: Grid 1 col mobile */}
              <div className="p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Thông tin thanh toán
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <div className="text-xs text-purple-600 mb-1">Số tiền</div>
                    <div className="text-xl md:text-2xl font-bold text-green-600">
                      {formatCurrency(selectedTransaction.amount || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-600 mb-1">Phương thức</div>
                    <div className="font-medium">
                      {getPaymentMethodBadge(selectedTransaction.paymentMethod)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-600 mb-1">Trạng thái</div>
                    <div className="font-medium">
                      {getPaymentStatusBadge(selectedTransaction.paymentStatus)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-600 mb-1">Ngân hàng</div>
                    <div className="font-medium truncate">{selectedTransaction.bankName || 'N/A'}</div>
                  </div>
                </div>

                {selectedTransaction.accountNumber && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="text-xs text-purple-600 mb-1">Số tài khoản</div>
                    <div className="font-medium font-mono break-all">{selectedTransaction.accountNumber}</div>
                  </div>
                )}
              </div>

              {/* Thông tin phiên sạc liên quan */}
              <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  🔌 Thông tin phiên sạc
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <div className="text-xs text-blue-600 mb-1">Mã phiên sạc</div>
                    <div className="font-medium">#{selectedTransaction.sessionId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 mb-1">Phương tiện</div>
                    <div className="font-medium">
                      {selectedTransaction.licensePlate || 'N/A'}
                      <div className="text-sm text-gray-600">
                        {selectedTransaction.vehicleBrand} {selectedTransaction.vehicleModel}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 mb-1">Năng lượng</div>
                    <div className="font-medium">{selectedTransaction.energyKwh || 0} kWh</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 mb-1">Thời gian sạc</div>
                    <div className="text-sm">
                      {selectedTransaction.sessionStartTime ? formatDateTime(selectedTransaction.sessionStartTime) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin thời gian & Thiết bị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase mb-1 font-semibold">
                    <Calendar className="w-3 h-3" /> Thời gian
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạo lúc:</span>
                      <span className="font-medium">{formatDateTime(selectedTransaction.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Thanh toán:</span>
                      <span className="font-medium">{formatDateTime(selectedTransaction.paymentTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase mb-1 font-semibold">
                    <Shield className="w-3 h-3" /> Thiết bị sạc
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Cổng sạc:</span>
                      <div className="font-medium">
                        #{selectedTransaction.connectorId} ({selectedTransaction.connectorType})
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Trạm sạc:</span>
                      <div className="font-medium">
                        Pole #{selectedTransaction.poleId} ({selectedTransaction.poleManufacturer})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t bg-gray-50 flex justify-end sticky bottom-0 z-10">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full md:w-auto px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
