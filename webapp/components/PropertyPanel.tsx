"use client";

import React from "react";
import type { WidgetSpec } from "@/lib/types";
import { getWidgetDef } from "@/lib/widgetRegistry";

const INPUT = "w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-400 focus:outline-none";

const BINDING_TARGETS: Record<string, string[]> = {
  button:        ["text", "enabled", "visible"],
  toggle_button: ["text", "enabled", "visible"],
  input:         ["text", "enabled", "visible"],
  slider:        ["enabled", "visible"],
  label:         ["text", "visible"],
  icon:          ["visible"],
  panel:         ["visible"],
};

interface Props {
  widget: WidgetSpec | null;
  onUpdate: (w: WidgetSpec) => void;
  onDelete: () => void;
}

export default function PropertyPanel({ widget, onUpdate, onDelete }: Props) {
  if (!widget) {
    return (
      <div className="flex flex-col gap-2 p-3 text-xs text-gray-400 italic">
        Select a widget to edit its properties.
      </div>
    );
  }

  const def = getWidgetDef(widget.type);

  const set = (patch: Partial<WidgetSpec>) => onUpdate({ ...widget, ...patch });
  const setProp = (key: string, value: string) => onUpdate({ ...widget, props: { ...widget.props, [key]: value } });

  const bindings = widget.bindings ?? {};
  const setBinding = (target: string, providerId: string) =>
    onUpdate({ ...widget, bindings: { ...bindings, [target]: providerId } });
  const removeBinding = (target: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [target]: _removed, ...rest } = bindings;
    onUpdate({ ...widget, bindings: Object.keys(rest).length ? rest : undefined });
  };

  const changeBindingTarget = (oldTarget: string, newTarget: string) => {
    const value = bindings[oldTarget];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [oldTarget]: _removed, ...rest } = bindings;
    onUpdate({ ...widget, bindings: { ...rest, [newTarget]: value } });
  };

  const availableTargets = BINDING_TARGETS[widget.type] ?? [];
  const unusedTargets = availableTargets.filter((t) => !(t in bindings));

  return (
    <div className="flex flex-col gap-1 p-2 text-xs overflow-y-auto">
      <div className="font-bold text-gray-700 mb-1 uppercase tracking-wide">{def?.label ?? widget.type}</div>

      <Field label="ID">
        <input className={INPUT} value={widget.id} onChange={(e) => set({ id: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-1">
        <Field label="X"><NumInput value={widget.x} onChange={(v) => set({ x: v })} /></Field>
        <Field label="Y"><NumInput value={widget.y} onChange={(v) => set({ y: v })} /></Field>
        <Field label="W"><NumInput value={widget.w} onChange={(v) => set({ w: v })} /></Field>
        <Field label="H"><NumInput value={widget.h} onChange={(v) => set({ h: v })} /></Field>
      </div>

      {widget.type !== "icon" && (
        <Field label="Text">
          <input className={INPUT} value={widget.text} onChange={(e) => set({ text: e.target.value })} />
        </Field>
      )}

      <Field label="Icon (URL or key)">
        <input
          className={INPUT}
          value={widget.icon ?? ""}
          onChange={(e) => set({ icon: e.target.value || null })}
          placeholder="optional"
        />
      </Field>

      {def && def.propSchema.length > 0 && (
        <>
          <div className="font-semibold text-gray-500 mt-1">Widget Props</div>
          {def.propSchema.map((field) => (
            <Field key={field.key} label={field.label}>
              {field.type === "select" ? (
                <select
                  className={INPUT}
                  value={widget.props[field.key] ?? field.defaultValue ?? ""}
                  onChange={(e) => setProp(field.key, e.target.value)}
                >
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={INPUT}
                  type={field.type === "number" ? "number" : "text"}
                  value={widget.props[field.key] ?? field.defaultValue ?? ""}
                  onChange={(e) => setProp(field.key, e.target.value)}
                />
              )}
            </Field>
          ))}
        </>
      )}

      <Field label="Action ID">
        <input
          className={INPUT}
          value={widget.action ?? ""}
          onChange={(e) => set({ action: e.target.value || undefined })}
          placeholder="e.g. close, my_mod:save"
        />
      </Field>

      {availableTargets.length > 0 && (
        <>
          <div className="font-semibold text-gray-500 mt-1">Bindings</div>
          {Object.entries(bindings).map(([target, providerId]) => (
            <div key={target} className="flex gap-1 items-center">
              <select
                className="shrink-0 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs text-gray-700 focus:outline-none"
                value={target}
                onChange={(e) => changeBindingTarget(target, e.target.value)}
              >
                {availableTargets
                  .filter((t) => t === target || !(t in bindings))
                  .map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                className={INPUT}
                value={providerId}
                onChange={(e) => setBinding(target, e.target.value)}
                placeholder="provider id"
              />
              <button
                className="shrink-0 text-gray-400 hover:text-red-500 px-1"
                onClick={() => removeBinding(target)}
              >✕</button>
            </div>
          ))}
          {unusedTargets.length > 0 && (
            <button
              className="w-full rounded border border-dashed border-gray-300 py-0.5 text-gray-400 hover:border-gray-400 hover:text-gray-600"
              onClick={() => setBinding(unusedTargets[0], "")}
            >
              + Add binding
            </button>
          )}
        </>
      )}

      <button
        className="mt-3 w-full rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
        onClick={onDelete}
      >
        Delete Widget
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      className={INPUT}
      type="number"
      value={value}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v)) onChange(v);
      }}
    />
  );
}
