import { appIconResponse } from "@/lib/app-icon";

export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({
  id,
}: {
  id: string | Promise<string>;
}) {
  return appIconResponse(Number(await id));
}
