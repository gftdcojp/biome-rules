/**
 * @gftdcojp/biome-rules demo
 * ✅ 正しい例: paramsがPromiseでラップされている
 */

import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return Response.json({ id: resolvedParams.id });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return Response.json({ id: resolvedParams.id });
}

