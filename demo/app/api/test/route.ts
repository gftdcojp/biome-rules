/**
 * @gftdcojp/biome-rules demo
 * ❌ 間違った例: paramsがPromiseでラップされていない
 */

import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return Response.json({ id: params.id });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return Response.json({ id: params.id });
}

