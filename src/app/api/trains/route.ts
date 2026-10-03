import { findTrainSightings } from "@/lib/sightings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  try {
    const result = await findTrainSightings(lat, lon);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not compute sightings.";
    const status = message.startsWith("Latitude") || message.startsWith("Longitude")
      ? 400
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
