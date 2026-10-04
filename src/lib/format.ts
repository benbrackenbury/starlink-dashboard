const utcDay = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "UTC",
});

const utcStamp = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  compactDisplay: "long",
  maximumFractionDigits: 2,
});

const count = new Intl.NumberFormat("en-GB");

export function formatUtcDay(iso: string) {
  return utcDay.format(new Date(iso));
}

export function formatUtcStamp(iso: string) {
  const value = /Z$|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  return `${utcStamp.format(new Date(value))}\u00a0UTC`;
}

export function formatLaunchWhen(iso: string, net?: boolean) {
  const stamp = formatUtcStamp(iso);
  return net ? `${stamp} (NET)` : stamp;
}

export function formatMoneyUsd(amount: number) {
  return money.format(amount);
}

export function formatCount(n: number) {
  return count.format(n);
}

export function formatLocalWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
