import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ASSET_REL = join("assets", "screenspec", "screenspec", "test_container_screen.json");
const RUNTIME_ROOT = join(process.cwd(), "..", "neoforge-runtime");
const TEST_SCREEN_PATH = join(RUNTIME_ROOT, "src", "main", "resources", ASSET_REL);
// Gradle's processResources output — what the running game's classpath actually reads from.
const TEST_SCREEN_BUILD_PATH = join(RUNTIME_ROOT, "build", "resources", "main", ASSET_REL);

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  try {
    const content = readFileSync(TEST_SCREEN_PATH, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: "Failed to read test screen" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const json = JSON.stringify(body, null, 2);
    writeFileSync(TEST_SCREEN_PATH, json);
    // Also write to Gradle's processResources output so a running runClient picks it up immediately.
    if (existsSync(TEST_SCREEN_BUILD_PATH)) writeFileSync(TEST_SCREEN_BUILD_PATH, json);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to write test screen" }, { status: 500 });
  }
}
