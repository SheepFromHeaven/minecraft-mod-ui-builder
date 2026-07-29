"use client";

import { useState, useEffect } from "react";

interface Props {
  onCreateProject: (modId: string, screenId: string) => void;
}

export default function WelcomeScreen({ onCreateProject }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [modId, setModId] = useState("");
  const [screenId, setScreenId] = useState("main");

  const canCreate = modId.trim().length > 0;

  const submit = () => {
    if (!canCreate) return;
    onCreateProject(modId.trim(), screenId.trim() || "main");
  };

  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit();
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showModal, modId, screenId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">MC Screen Designer</h1>
        <p className="mt-1 text-sm text-gray-500">Visual designer for Minecraft mod GUI screens</p>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-xl border border-gray-200 bg-white px-16 py-12 shadow-sm">
        <div className="text-5xl select-none">🗂️</div>
        <p className="text-sm text-gray-400">No projects yet</p>
        <button
          className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + New Project
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex w-80 flex-col gap-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">New Project</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Mod ID <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                className="rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="e.g. my_mod"
                value={modId}
                onChange={(e) => setModId(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Your mod's namespace — qualifies binding and action IDs automatically
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">First screen ID</label>
              <input
                className="rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="main"
                value={screenId}
                onChange={(e) => setScreenId(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canCreate}
                onClick={submit}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
