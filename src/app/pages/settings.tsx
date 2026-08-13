"use client";

import { SlidersHorizontal, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { InformationTab } from "../components/settings/InformationTab";
import { AppearanceTab } from "../components/settings/AppearanceTab";
import { ToggleOption } from "../components/settings/ToggleOption";
import { useConfigStore } from "../../stores/settings";
import { Config } from "../../util/config";

type Tab = "general" | "options";

const tabs: { id: Tab; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "options", label: "Options", icon: SettingsIcon },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const location = useLocation();
  const config = useConfigStore();

  const supportsEdit = Config.LAUNCH_OPTIONS.EDIT_ON_RELEASE_DLL;
  const supportsReset = Config.LAUNCH_OPTIONS.RESET_ON_RELEASE_DLL;

  let editLabel = "Edit & Reset on Release";
  let editDescription = "Automatically confirms edit and reset when you release.";
  if (supportsEdit && !supportsReset) {
    editLabel = "Edit on Release";
    editDescription = "Automatically confirms edit when you release.";
  }
  if (!supportsEdit && supportsReset) {
    editLabel = "Reset on Release";
    editDescription = "Automatically confirms reset when you release.";
  }

  useEffect(() => {
    setActiveTab("general");
  }, [location.key]);

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-white">Settings</h1>

        <div className="flex gap-1 rounded-xl bg-white/5 border border-white/8 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === id
                  ? "bg-white/12 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          {activeTab === "general" && (
            <div className="flex flex-col gap-4">
              <InformationTab />
              <AppearanceTab />
            </div>
          )}

          {activeTab === "options" && (
            <div className="flex flex-col gap-2">
              {config.showEditOnRelease && (supportsEdit || supportsReset) && (
                <SettingsRow
                  label={editLabel}
                  description={editDescription}
                  value={config.editAndRelease}
                  onChange={(v) => {
                    config.setEditAndRelease(v);
                    if (supportsEdit) config.setEditOnRelease(v);
                    if (supportsReset) config.setResetOnRelease(v);
                  }}
                />
              )}

              {config.showBubbleBuilds && Config.LAUNCH_OPTIONS.BUBBLE_BUILDS != null && (
                <SettingsRow
                  label="Bubble Builds"
                  description="Enables the bubble builds pak files on launch."
                  value={config.bubbleBuilds}
                  onChange={config.setBubbleBuilds}
                />
              )}

              {config.showMobileBuilds && Config.LAUNCH_OPTIONS.MOBILE_BUILDS != null && (
                <SettingsRow
                  label="Mobile Builds"
                  description="Enables mobile build pak files on launch."
                  value={config.mobileBuilds}
                  onChange={config.setMobileBuilds}
                />
              )}

              {config.showMinimizeOnLaunch && (
                <SettingsRow
                  label="Minimize on Launch"
                  description="Minimizes the launcher when the game starts."
                  value={config.minimizeOnLaunch}
                  onChange={config.setMinimizeOnLaunch}
                />
              )}

              {config.showAlwaysOnTop && (
                <SettingsRow
                  label="Always on Top"
                  description="Keeps the launcher above all other windows."
                  value={config.alwaysOnTop}
                  onChange={config.setAlwaysOnTop}
                />
              )}

              <SettingsRow
                label="Performance Mode"
                description="Adds -FeatureLevelES31 to launch args for lower-end PCs."
                value={config.performanceMode}
                onChange={config.setPerformanceMode}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3.5 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <ToggleOption value={value} onChange={onChange} label="" />
    </div>
  );
}
