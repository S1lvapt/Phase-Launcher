"use client";

import {
  Home,
  Library,
  LogOut,
  Server,
  Settings,
  ShoppingCart,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Config } from "../../util/config";
import { useUIStore } from "../../stores/ui";
import { useOwnerMode } from "../../hooks/useOwnerMode";
import { useState } from "react";

type NavItem = {
  id: string;
  path: string;
  icon: typeof Home;
  label: string;
  danger?: boolean;
  zynix?: boolean;
  isAction?: boolean;
  onClick?: () => void;
};

function CrownIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="zynix-crown-gradient" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#40a9ff" />
          <stop offset="100%" stopColor="#bf5af2" />
        </linearGradient>
      </defs>
      <path
        d="M3 8.5 6.8 12l2.9-5.2c.55-.99 1.96-.99 2.51 0L15.1 12l3.9-3.5c.9-.8 2.28-.02 2.05 1.15l-1.7 8.35a1.3 1.3 0 0 1-1.28 1.05H4.83a1.3 1.3 0 0 1-1.28-1.05l-1.7-8.35C1.62 8.48 3 7.7 3.9 8.5Z"
        fill="url(#zynix-crown-gradient)"
      />
    </svg>
  );
}

function DockItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="dock-tooltip"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.14, y: -3 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className={`dock-btn ${active ? "active" : ""} ${item.danger ? "danger" : ""} ${item.zynix ? "zynix" : ""}`}
        aria-label={item.label}
      >
        {item.zynix ? <CrownIcon size={18} /> : <Icon size={18} />}

        {/* Active dot */}
        {active && <span className="dock-active-dot" />}
      </motion.button>
    </div>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const openLogoutModal = useUIStore((state) => state.openLogoutModal);
  const isOwner = useOwnerMode();

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  const mainItems: NavItem[] = [
    { id: "home", path: "/", icon: Home, label: "Home" },
    { id: "library", path: "/library", icon: Library, label: "Library" },
    { id: "shop", path: "/shop", icon: ShoppingCart, label: "Item Shop" },
    { id: "servers", path: "/servers", icon: Server, label: "Servers" },
  ];

  if (Config.LEADERBOARD_ENABLED) {
    mainItems.push({
      id: "leaderboard",
      path: "/leaderboard",
      icon: Trophy,
      label: "Leaderboard",
    });
  }

  if (isOwner) {
    mainItems.push({
      id: "zynix",
      path: "/zynix-room",
      icon: Home, // replaced by CrownIcon via zynix flag
      label: "Zynix Room",
      zynix: true,
    });
  }

  const endItems: NavItem[] = [
    { id: "settings", path: "/settings", icon: Settings, label: "Settings" },
    {
      id: "logout",
      path: "",
      icon: LogOut,
      label: "Log Out",
      danger: true,
      isAction: true,
      onClick: openLogoutModal,
    },
  ];

  const allItems = [...mainItems, ...endItems];

  return (
    <nav className="dock-shell" aria-label="Main navigation">
      <div className="dock-inner">
        {allItems.map((item) => (
          <DockItem
            key={item.id}
            item={item}
            active={!item.isAction && isActive(item.path)}
            onClick={item.isAction && item.onClick ? item.onClick : () => navigate(item.path)}
          />
        ))}
      </div>
    </nav>
  );
}
