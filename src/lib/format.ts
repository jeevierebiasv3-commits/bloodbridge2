/** Lightweight formatting helpers (no external deps). */

export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime();
  const diff = then - now.getTime();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  const fmt = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  let text: string;
  if (abs < min) text = 'just now';
  else if (abs < hour) text = fmt(Math.round(abs / min), 'min');
  else if (abs < day) text = fmt(Math.round(abs / hour), 'hr');
  else text = fmt(Math.round(abs / day), 'day');
  if (text === 'just now') return text;
  return diff < 0 ? `${text} ago` : `in ${text}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

export function distanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
