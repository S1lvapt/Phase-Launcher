"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ImageIcon, RotateCcw } from "lucide-react";
import { OptionGroup } from "../components/settings/OptionGroup";
import { useZynixRoomStore } from "../../stores/zynixRoom";

const PRESET_GRADIENTS: { from: string; to: string; label: string }[] = [
  { from: "#40a9ff", to: "#bf5af2", label: "Aurora" },
  { from: "#ff9f0a", to: "#ff375f", label: "Sunset" },
  { from: "#30d98a", to: "#0a84ff", label: "Emerald" },
  { from: "#ffd166", to: "#ef4444", label: "Ember" },
  { from: "#ffffff", to: "#a1a1aa", label: "Platinum" },
];

export function ZynixRoom() {
  const room = useZynixRoomStore();
  const [pickingImage, setPickingImage] = useState(false);

  async function pickWelcomeImage() {
    setPickingImage(true);
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: "Image",
            extensions: ["png", "jpg", "jpeg", "webp", "gif"],
          },
        ],
      });

      if (!selected) return;

      const path = selected.toString();
      const url = convertFileSrc(path);
      room.setWelcomeImage(path, url);
    } finally {
      setPickingImage(false);
    }
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1>Zynix Room</h1>
        </div>
      </header>

      <div className="settings-stack">
        <OptionGroup
          title="Name Gradient"
          description="Choose the gradient applied to your display name in the welcome card."
        >
          <div className="theme-card-grid">
            {PRESET_GRADIENTS.map((preset) => {
              const active =
                room.gradientFrom === preset.from && room.gradientTo === preset.to;

              return (
                <motion.button
                  key={preset.label}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className={`theme-card ${active ? "active" : ""}`}
                  onClick={() => room.setGradient(preset.from, preset.to)}
                  aria-label={preset.label}
                >
                  <span
                    className="theme-card-swatch"
                    style={{
                      background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                    }}
                  />
                  <span className="theme-card-label">{preset.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              From
              <input
                type="color"
                value={room.gradientFrom}
                onChange={(e) => room.setGradient(e.target.value, room.gradientTo)}
                className="h-8 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              To
              <input
                type="color"
                value={room.gradientTo}
                onChange={(e) => room.setGradient(room.gradientFrom, e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
            </label>
          </div>
        </OptionGroup>

        <OptionGroup
          title="Role Label"
          description="Shown after your name in the welcome card."
        >
          <input
            type="text"
            value={room.roleLabel}
            maxLength={24}
            onChange={(e) => room.setRoleLabel(e.target.value)}
            placeholder="Owner"
            className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none"
          />
        </OptionGroup>

        <OptionGroup
          title="Welcome Card Image"
          description="Pick any image from your device to use as your welcome card picture."
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-raised)]">
              {room.welcomeImageUrl ? (
                <img
                  src={room.welcomeImageUrl}
                  alt="Welcome"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                  <ImageIcon size={20} />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                className="secondary-button"
                onClick={pickWelcomeImage}
                disabled={pickingImage}
              >
                <ImageIcon size={16} />
                Choose Image
              </button>

              {room.welcomeImageUrl && (
                <button
                  className="icon-button"
                  onClick={() => room.setWelcomeImage(null, null)}
                  aria-label="Reset image"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>
        </OptionGroup>
      </div>
    </div>
  );
}
