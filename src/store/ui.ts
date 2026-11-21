import { create } from 'zustand';
export const useUI = create<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }>(
  (set) => ({ sidebarOpen: false, setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }) }),
);
