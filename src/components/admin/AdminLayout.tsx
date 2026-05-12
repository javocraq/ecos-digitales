import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BookMarked,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Video as VideoIcon,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_BASE_PATH } from "@/config/admin";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_STATE_KEY = "admin:sidebar:collapsed";

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const navItems = [
    {
      to: `${ADMIN_BASE_PATH}/articulos`,
      icon: FileText,
      label: "Artículos",
    },
    {
      to: `${ADMIN_BASE_PATH}/ediciones`,
      icon: BookMarked,
      label: "Ediciones",
    },
    {
      to: `${ADMIN_BASE_PATH}/video`,
      icon: VideoIcon,
      label: "Video",
    },
    {
      to: `${ADMIN_BASE_PATH}/banner`,
      icon: Megaphone,
      label: "Banner",
    },
    {
      to: `${ADMIN_BASE_PATH}/dashboard`,
      icon: LayoutDashboard,
      label: "Dashboard",
    },
  ];

  const sidebarWidth = collapsed ? "60px" : "240px";

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Sidebar — fixed so it always covers the full viewport height regardless of page scroll */}
      <aside
        className={`${
          collapsed ? "w-[60px]" : "w-[240px]"
        } fixed inset-y-0 left-0 z-30 border-r border-black/[0.06] bg-[#fbfbfa] flex flex-col transition-[width] duration-200 ease-out`}
      >
        {/* Workspace header */}
        <div className="px-3 pt-3 pb-2 flex items-center gap-2">
          {!collapsed && (
            <Link
              to={`${ADMIN_BASE_PATH}/articulos`}
              className="flex-1 px-2 py-1 rounded-md hover:bg-black/[0.04] transition-colors min-w-0"
            >
              <span className="block text-[13px] font-semibold text-neutral-800 truncate">
                Ecos Digitales
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-black/[0.04] transition-colors shrink-0"
            title={collapsed ? "Abrir sidebar" : "Cerrar sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 flex-1 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center ${
                    collapsed ? "justify-center" : "gap-2 px-2"
                  } h-8 rounded-md text-[13px] transition-colors ${
                    isActive
                      ? "bg-black/[0.06] text-neutral-900 font-medium"
                      : "text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-900"
                  }`
                }
                title={item.label}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-black/[0.06] p-3">
          <button
            type="button"
            onClick={signOut}
            className={`flex items-center ${
              collapsed ? "justify-center w-full" : "gap-2 px-2 w-full"
            } h-8 rounded-md text-[13px] text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-900 transition-colors`}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <main
        className="min-w-0 overflow-x-hidden transition-[padding-left] duration-200 ease-out"
        style={{ paddingLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
};
