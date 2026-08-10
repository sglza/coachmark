import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/dev/components/ui/select";
import { Slider } from "@/dev/components/ui/slider";
import { Switch } from "@/dev/components/ui/switch";
import type { PlaygroundConfig, StylingMode } from "../playground-types";

type ConfigControlsProps = {
  config: PlaygroundConfig;
  onChange: (config: PlaygroundConfig) => void;
  onStylingModeChange: (mode: StylingMode) => void;
  stylingMode: StylingMode;
};

export function ConfigControls({
  config,
  onChange,
  onStylingModeChange,
  stylingMode,
}: ConfigControlsProps) {
  const update = <Key extends keyof PlaygroundConfig>(
    key: Key,
    value: PlaygroundConfig[Key],
  ) => onChange({ ...config, [key]: value });

  return (
    <div className="border-border border-y py-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
        <SelectControl
          label="Styling"
          onChange={(value) => onStylingModeChange(value as StylingMode)}
          options={[
            ["css-modules", "CSS Modules"],
            ["tailwind", "Tailwind"],
          ]}
          value={stylingMode}
        />
        <span className="bg-border hidden h-8 w-px self-end sm:block" />
        <SelectControl
          label="Side"
          onChange={(value) => update("side", value as PlaygroundConfig["side"])}
          options={[
            ["top", "Top"],
            ["right", "Right"],
            ["bottom", "Bottom"],
            ["left", "Left"],
          ]}
          value={config.side}
        />
        <SelectControl
          label="Align"
          onChange={(value) => update("align", value as PlaygroundConfig["align"])}
          options={[
            ["start", "Start"],
            ["center", "Center"],
            ["end", "End"],
          ]}
          value={config.align}
        />
        <SelectControl
          label="Transition"
          onChange={(value) =>
            update("transition", value as PlaygroundConfig["transition"])
          }
          options={[
            ["move", "Move"],
            ["fade", "Fade"],
            ["none", "None"],
          ]}
          value={config.transition}
        />
        <SelectControl
          label="Modal"
          onChange={(value) =>
            update(
              "modal",
              value === "true"
                ? true
                : value === "false"
                  ? false
                  : "trap-focus",
            )
          }
          options={[
            ["true", "Modal"],
            ["trap-focus", "Trap focus"],
            ["false", "Non-modal"],
          ]}
          value={String(config.modal)}
        />
        <SwitchControl
          checked={config.arrow}
          label="Arrow"
          onChange={(checked) => update("arrow", checked)}
        />
        <SwitchControl
          checked={config.viewport}
          disabled={config.transition !== "move"}
          label="Viewport morph"
          onChange={(checked) => update("viewport", checked)}
        />
        <SwitchControl
          checked={config.backdrop}
          label="Backdrop"
          onChange={(checked) => update("backdrop", checked)}
        />
        <SwitchControl
          checked={config.resetOnOpen}
          label="Reset on open"
          onChange={(checked) => update("resetOnOpen", checked)}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-4">
        <SliderControl
          label="Side offset"
          max={48}
          onChange={(value) => update("sideOffset", value)}
          value={config.sideOffset}
        />
        <SliderControl
          label="Align offset"
          max={48}
          min={-48}
          onChange={(value) => update("alignOffset", value)}
          value={config.alignOffset}
        />
        <SliderControl
          label="Padding"
          max={32}
          onChange={(value) => update("spotlightPadding", value)}
          value={config.spotlightPadding}
        />
        <SliderControl
          label="Radius"
          max={40}
          onChange={(value) => update("spotlightRadius", value)}
          value={config.spotlightRadius}
        />
      </div>
    </div>
  );
}

function SelectControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <Select onValueChange={(next) => onChange(String(next))} value={value}>
        <SelectTrigger className="w-28" size="sm">
          <SelectValue>
            {(selectedValue) =>
              options.find(
                ([optionValue]) => optionValue === String(selectedValue),
              )?.[1] ?? String(selectedValue)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectPopup>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </label>
  );
}

function SwitchControl({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-12 items-end gap-2 pb-1.5 text-xs">
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
      <span className={disabled ? "text-muted-foreground" : undefined}>{label}</span>
    </label>
  );
}

function SliderControl({
  label,
  max,
  min = 0,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid w-44 gap-2">
      <span className="text-muted-foreground flex justify-between text-[11px]">
        {label}
        <output className="text-foreground font-mono">{value}px</output>
      </span>
      <Slider
        max={max}
        min={min}
        onValueChange={(next) =>
          onChange(Array.isArray(next) ? next[0] : next)
        }
        value={value}
      />
    </label>
  );
}
