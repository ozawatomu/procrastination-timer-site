export type Kind = 'studying' | 'procrastinating';

export type Totals = Record<Kind, number>;

export type Readout = Record<Kind, string>;

const HOUR = 3_600_000;

const pad = (value: number) => value.toString().padStart(2, '0');

export function formatDuration(ms: number, showHours: boolean): string {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000);
  const seconds = pad(totalSeconds % 60);
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (!showHours) return `${totalMinutes}:${seconds}`;
  return `${Math.floor(totalMinutes / 60)}:${pad(totalMinutes % 60)}:${seconds}`;
}

export function formatReadout(totals: Totals): Readout {
  const showHours = totals.studying >= HOUR || totals.procrastinating >= HOUR;
  return {
    studying: formatDuration(totals.studying, showHours),
    procrastinating: formatDuration(totals.procrastinating, showHours),
  };
}

export function speakDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  if (seconds || parts.length === 0)
    parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
  return parts.join(' ');
}
