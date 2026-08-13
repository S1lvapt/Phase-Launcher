"use client";

import { OptionGroup } from "./OptionGroup";
import { ToggleOption } from "./ToggleOption";
import { DropdownOption } from "./DropdownOption";
import { useConfigStore } from "../../../stores/settings";

export function OptionsTab() {
  const config = useConfigStore();

  return (
    <div className="flex flex-col gap-5">
      <OptionGroup title="General" description="Core launcher settings">
        <ToggleOption
          label="Launch on startup"
          description="Automatically start the launcher when your system boots"
          defaultChecked={true}
        />
        <div className="h-px bg-border" />
        <ToggleOption
          label="Minimize to tray"
          description="Keep running in the system tray when closed"
          defaultChecked={true}
        />
        <div className="h-px bg-border" />
        <ToggleOption
          label="Auto-update"
          description="Automatically checks for available updates"
          defaultChecked={true}
        />
      </OptionGroup>

      <OptionGroup title="Builds" description="Choose which build type to use">
        {config.showBubbleBuilds && (
          <>
            <ToggleOption
              label="Bubble Builds"
              description="Enable bubble build paks. Disables Mobile Builds."
              value={config.bubbleBuilds}
              onChange={config.setBubbleBuilds}
            />
            {config.showMobileBuilds && <div className="h-px bg-border" />}
          </>
        )}
        {config.showMobileBuilds && (
          <ToggleOption
            label="Mobile Builds"
            description="Enable mobile build paks. Disables Bubble Builds."
            value={config.mobileBuilds}
            onChange={config.setMobileBuilds}
          />
        )}
      </OptionGroup>

      <OptionGroup title="Launcher" description="Configure launcher behavior and launch options.">
        {config.showEditOnRelease && (
          <>
            <ToggleOption
              label="Edit & Reset on Release"
              description="Automatically confirms edit and reset when you release."
              value={config.editOnRelease}
              onChange={config.setEditOnRelease}
            />
            <div className="h-px bg-border" />
          </>
        )}
        {config.showResetOnRelease && (
          <>
            <ToggleOption
              label="Reset on Release"
              description="Automatically resets your build when you release the edit key."
              value={config.resetOnRelease}
              onChange={config.setResetOnRelease}
            />
            <div className="h-px bg-border" />
          </>
        )}
        {config.showMinimizeOnLaunch && (
          <>
            <ToggleOption
              label="Minimize on Launch"
              description="Minimizes the launcher when launching Fortnite."
              value={config.minimizeOnLaunch}
              onChange={config.setMinimizeOnLaunch}
            />
            <div className="h-px bg-border" />
          </>
        )}
        {config.showAlwaysOnTop && (
          <ToggleOption
            label="Always on Top"
            description="Keeps the launcher above other windows."
            value={config.alwaysOnTop}
            onChange={config.setAlwaysOnTop}
          />
        )}
      </OptionGroup>

      <OptionGroup
        title="Notifications"
        description="Control how you receive alerts"
      >
        <ToggleOption
          label="Desktop notifications"
          description="Show system notifications for important events"
          defaultChecked={true}
        />
        <div className="h-px bg-border" />
        <ToggleOption
          label="Sound effects"
          description="Play audio cues for actions and alerts"
          defaultChecked={false}
        />
      </OptionGroup>

      <OptionGroup title="Performance" description="Optimize resource usage">
        <DropdownOption
          label="Hardware acceleration"
          description="Use GPU for rendering when available"
          options={[
            { value: "auto", label: "Auto" },
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
          ]}
          defaultValue="auto"
        />
        <div className="h-px bg-border" />
        <ToggleOption
          label="Low power mode"
          description="Reduce background activity to save battery"
          defaultChecked={false}
        />
      </OptionGroup>
    </div>
  );
}
