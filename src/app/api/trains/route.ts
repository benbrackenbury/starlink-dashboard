import { unstable_cache } from "next/cache";
import { findTrainSightings } from "@/lib/sightings";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const sightingsFor = unstable_cache(
  async (lat: string, lon: string) =>
    findTrainSightings(Number(lat), Number(lon)),
  ["train-sightings-v1"],
  { revalidate: 120 },
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  try {
    const result = await sightingsFor(lat.toFixed(2), lon.toFixed(2));
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=90",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not compute sightings.";
    const status = message.startsWith("Latitude") || message.startsWith("Longitude")
      ? 400
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
