"use client";

import React from "react";
import type { WidgetSpec, BindingsSchema } from "@/lib/types";
import { getWidgetDef } from "@/lib/widgetRegistry";
import { getBindingNode, getPathsByType } from "@/components/BindingsTree";
import type { BindingType } from "@/lib/types";

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

const BINDING_TARGET_TYPES: Record<string, BindingType> = {
  text:    "string",
  enabled: "boolean",
  visible: "boolean",
};

interface Props {
  widget: WidgetSpec | null;
  onUpdate: (w: WidgetSpec) => void;
  onDelete: () => void;
  bindingsSchema: BindingsSchema;
  actions: string[];
  /** Ids of inventory_area widgets on the current screen, for the scrollbar target picker. */
  inventoryAreaIds?: string[];
}

export default function PropertyPanel({ widget, onUpdate, onDelete, bindingsSchema, actions, inventoryAreaIds = [] }: Props) {
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

      {widget.type !== "group" && (
        <div className="grid grid-cols-2 gap-1">
          <Field label="X"><NumInput value={widget.x} onChange={(v) => set({ x: v })} /></Field>
          <Field label="Y"><NumInput value={widget.y} onChange={(v) => set({ y: v })} /></Field>
          {!(widget.type === "scrollbar" && (widget.props.axis ?? "y") === "y") && (
            <Field label="W"><NumInput value={widget.w} onChange={(v) => set({ w: v })} /></Field>
          )}
          {!(widget.type === "scrollbar" && widget.props.axis === "x") && (
            <Field label="H"><NumInput value={widget.h} onChange={(v) => set({ h: v })} /></Field>
          )}
        </div>
      )}

      {widget.type !== "icon" && widget.type !== "group" && (
        <Field label="Text">
          <input
            className={`${INPUT} ${bindings.text ? "text-blue-500 italic" : ""}`}
            value={bindings.text ? bindings.text : widget.text}
            disabled={!!bindings.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder={bindings.text ? undefined : ""}
          />
        </Field>
      )}

      {widget.type !== "group" && (
        <Field label="Icon (URL or key)">
          <input
            className={INPUT}
            value={widget.icon ?? ""}
            onChange={(e) => set({ icon: e.target.value || null })}
            placeholder="optional"
          />
        </Field>
      )}

      {def && def.propSchema.length > 0 && (
        <>
          <div className="font-semibold text-gray-500 mt-1">Widget Props</div>
          {def.propSchema.map((field) => {
            const currentValue = widget.props[field.key] ?? field.defaultValue ?? "";
            if (widget.type === "scrollbar" && field.key === "target") {
              // Free text risks a typo'd id silently producing no scrollbar (see runtime README) —
              // once there's more than one inventory_area, picking from the real ids is much safer.
              return (
                <Field key={field.key} label={field.label}>
                  <select
                    className={INPUT}
                    value={currentValue}
                    onChange={(e) => setProp(field.key, e.target.value)}
                  >
                    <option value="">(none)</option>
                    {!!currentValue && !inventoryAreaIds.includes(currentValue) && (
                      <option value={currentValue}>{currentValue} ⚠ not found</option>
                    )}
                    {inventoryAreaIds.map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </Field>
              );
            }
            return (
              <Field key={field.key} label={field.label}>
                {field.type === "select" ? (
                  <select
                    className={INPUT}
                    value={currentValue}
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
                    value={currentValue}
                    onChange={(e) => setProp(field.key, e.target.value)}
                  />
                )}
              </Field>
            );
          })}
        </>
      )}

      {widget.type !== "group" && (
        <Field label="Action">
          {actions.length > 0 ? (
            <select
              className={INPUT}
              value={widget.action ?? ""}
              onChange={(e) => set({ action: e.target.value || undefined })}
            >
              <option value="">(none)</option>
              <option value="close">close</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          ) : (
            <input
              className={INPUT}
              value={widget.action ?? ""}
              onChange={(e) => set({ action: e.target.value || undefined })}
              placeholder="e.g. close, my_mod.save"
            />
          )}
        </Field>
      )}

      {availableTargets.length > 0 && (
        <>
          <div className="font-semibold text-gray-500 mt-1">Bindings</div>
          <>
            {Object.entries(bindings).map(([target, path]) => {
              const expectedType = BINDING_TARGET_TYPES[target] ?? "string";
              const paths = getPathsByType(bindingsSchema, expectedType);
              const currentNode = getBindingNode(bindingsSchema, path);
              const currentCompatible = !path || (currentNode?.type ?? "string") === expectedType;
              return (
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
                  <select
                    className={INPUT + (!currentCompatible ? " border-orange-400" : "")}
                    value={path}
                    onChange={(e) => setBinding(target, e.target.value)}
                  >
                    {paths.length === 0 && (
                      <option value="" disabled>No {expectedType} bindings defined</option>
                    )}
                    {!paths.includes(path) && path && (
                      <option value={path}>{path} ⚠ wrong type</option>
                    )}
                    {paths.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button
                    className="shrink-0 text-gray-400 hover:text-red-500 px-1"
                    onClick={() => removeBinding(target)}
                  >✕</button>
                </div>
              );
            })}
            {unusedTargets.length > 0 && (() => {
              const firstTarget = unusedTargets[0];
              const expectedType = BINDING_TARGET_TYPES[firstTarget] ?? "string";
              const paths = getPathsByType(bindingsSchema, expectedType);
              return (
                <button
                  className="w-full rounded border border-dashed border-gray-300 py-0.5 text-gray-400 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={paths.length === 0}
                  onClick={() => setBinding(firstTarget, paths[0])}
                >
                  {paths.length === 0 ? `Define a ${expectedType} binding first` : "+ Add binding"}
                </button>
              );
            })()}
          </>
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
