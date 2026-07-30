import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const TEST_SCREEN_PATH = join(
  process.cwd(),
  "..",
  "neoforge-runtime",
  "src",
  "main",
  "resources",
  "assets",
  "screenspec",
  "screenspec",
  "test_screen.json",
);

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
    writeFileSync(TEST_SCREEN_PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to write test screen" }, { status: 500 });
  }
}
