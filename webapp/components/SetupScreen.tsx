"use client";

import { useRef, useState } from "react";
import { Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTextures } from "@/lib/TextureContext";

export default function SetupScreen() {
  const { extractPack } = useTextures();
  const [loading, setLoading] = useState(false);
  const [packResult, setPackResult] = useState<{ extracted: number; missing: string[] } | null>(null);
  const [packError, setPackError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLoading(true);
    setPackResult(null);
    setPackError(null);
    try {
      const result = await extractPack(file);
      setPackResult({ extracted: result.extracted.length, missing: result.missing });
    } catch (err) {
      setPackError(err instanceof Error ? err.message : "Failed to read file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">MC Screen Designer</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          To show Minecraft GUI textures, load your own game files. They are extracted locally — nothing leaves your browser.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <PackageOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Load from Minecraft JAR or resource pack</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your <code className="font-mono">1.21.x.jar</code> from your Minecraft install, or any <code className="font-mono">.zip</code> resource pack.
              </p>
            </div>
          </div>

          <input ref={inputRef} type="file" accept=".jar,.zip" className="hidden" onChange={handleFile} />

          <Button onClick={() => inputRef.current?.click()} disabled={loading} className="w-full">
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting textures…</>
              : "Browse for JAR / ZIP"}
          </Button>

          {packResult && (
            <p className="text-xs text-center">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {packResult.extracted} / 7 textures extracted
              </span>
              {packResult.missing.length > 0 && (
                <span className="text-muted-foreground">
                  {" — "}{packResult.missing.length} not found in this pack
                </span>
              )}
            </p>
          )}

          {packError && (
            <p className="text-xs text-center text-destructive">{packError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
