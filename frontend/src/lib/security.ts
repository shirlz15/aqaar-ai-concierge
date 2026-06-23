import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

export const MAX_JSON_BYTES = 16_384;

export async function readValidatedJson<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_JSON_BYTES) {
    throw new HttpError(413, "Request payload is too large.");
  }
  const data: unknown = await request.json();
  return schema.parse(data);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function safeApiError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ detail: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json({ detail: "Invalid request payload." }, { status: 422 });
  }
  return NextResponse.json({ detail: "An unexpected error occurred." }, { status: 500 });
}

export function auditClientEvent(eventType: string, metadata: Record<string, unknown>) {
  console.info(JSON.stringify({ eventType, severity: "info", metadata, timestamp: new Date().toISOString() }));
}
