import { unstable_cache } from "next/cache";
import { findTrainSightings } from "@/lib/sightings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const sightingsFor = unstable_cache(
  async (lat: string, lon: string, _minute: string) =>
    findTrainSightings(Number(lat), Number(lon)),
  ["train-sightings-v1"],
  { revalidate: 60 },
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  try {
    const minute = String(Math.floor(Date.now() / 60_000));
    const result = await sightingsFor(lat.toFixed(2), lon.toFixed(2), minute);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
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
