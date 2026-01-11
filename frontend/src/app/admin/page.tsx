"use client";

import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Zap, BarChart3, Ambulance, BatteryCharging, CreditCard, Menu, X } from "lucide-react";

import AdminCheck from "./_AdminCheck";
import StationManagement from "./StationManagement";
import UserManagement from "./UserManagement";
import DashboardOverview from "./DashboardOverview";
import RescueStationManagement from "./RescueStationManagement";
import ChargingSessionManagement from "./ChargingSessionManagement";
import TransactionManagement from "./TransactionManagement";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stations' | 'users' | 'rescue' | 'charging-sessions' | 'transactions'>('dashboard');

  // State quản lý Sidebar trên Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tự động đóng sidebar khi chuyển tab trên mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  return (
    <AdminCheck fallback={<div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Đang tải quyền Admin...</div>}>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">

        {/* --- MOBILE HEADER (Chỉ hiện trên màn hình nhỏ) --- */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="font-bold flex items-center gap-2">
            <LayoutDashboard className="text-blue-400 w-5 h-5" /> ADMIN PORTAL
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded hover:bg-slate-800">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* --- OVERLAY (Che nền khi mở sidebar trên mobile) --- */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* --- SIDEBAR --- */}
        {/* Thêm class chuyển động trượt và logic hiển thị responsive */}
        <aside className={`
          bg-slate-900 text-white flex flex-col
          fixed md:sticky top-0 md:top-16 bottom-0 left-0 h-[calc(100vh)] md:h-[calc(100vh-4rem)]
          w-64 md:w-56 z-40 shadow-xl overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 border-b border-slate-800 hidden md:block">
            <h1 className="text-lg font-bold tracking-wider flex items-center gap-2">
              <LayoutDashboard className="text-blue-400 w-5 h-5" /> ADMIN
            </h1>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-0">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-2">Hệ thống</div>

            {/* Helper render Tab Button để code gọn hơn */}
            <SidebarButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={BarChart3}
              label="Tổng Quan"
            />
            <SidebarButton
              active={activeTab === 'stations'}
              onClick={() => setActiveTab('stations')}
              icon={Zap}
              label="Trạm Sạc"
            />
            <SidebarButton
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              icon={Users}
              label="Người Dùng"
            />
            <SidebarButton
              active={activeTab === 'rescue'}
              onClick={() => setActiveTab('rescue')}
              icon={Ambulance}
              label="Cứu Hộ"
              colorClass="bg-red-600 shadow-red-900/50"
            />
            <SidebarButton
              active={activeTab === 'charging-sessions'}
              onClick={() => setActiveTab('charging-sessions')}
              icon={BatteryCharging}
              label="Phiên Sạc"
            />
            <SidebarButton
              active={activeTab === 'transactions'}
              onClick={() => setActiveTab('transactions')}
              icon={CreditCard}
              label="Giao Dịch"
              colorClass="bg-purple-600 shadow-purple-900/50"
            />
          </nav>
        </aside>

        {/* --- MAIN CONTENT --- */}
        {/* Xóa ml-56 cứng, thay bằng flex-1 và padding responsive */}
        <main className="flex-1 w-full p-4 md:p-8 pt-6 md:pt-24 min-h-screen transition-all">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'stations' && <StationManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'rescue' && <RescueStationManagement />}
          {activeTab === 'charging-sessions' && <ChargingSessionManagement />}
          {activeTab === 'transactions' && <TransactionManagement />}
        </main>
      </div>
    </AdminCheck>
  );
}

// Component phụ cho nút Sidebar
function SidebarButton({ active, onClick, icon: Icon, label, colorClass = "bg-blue-600 shadow-blue-900/50" }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
        ? `${colorClass} text-white shadow-lg`
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
