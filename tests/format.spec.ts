import { test, expect } from '@playwright/test';
import {
  formatDuration,
  formatReadout,
  speakDuration,
} from '../src/scripts/format';

test('formats like the app: m:ss until either side reaches an hour', () => {
  expect(formatDuration(0, false)).toBe('0:00');
  expect(formatDuration(65_000, false)).toBe('1:05');
  expect(formatDuration(59 * 60_000, false)).toBe('59:00');
  expect(formatDuration(3_600_000, true)).toBe('1:00:00');
  expect(formatDuration(5_527_000, true)).toBe('1:32:07');
  expect(formatDuration(291_000, true)).toBe('0:04:51');
  expect(formatDuration(-5, false)).toBe('0:00');
  expect(formatDuration(999, false)).toBe('0:00');
});

test('both readouts flip to hours together', () => {
  expect(
    formatReadout({ studying: 1_477_000, procrastinating: 372_000 }),
  ).toEqual({
    studying: '24:37',
    procrastinating: '6:12',
  });
  expect(
    formatReadout({ studying: 3_637_000, procrastinating: 372_000 }),
  ).toEqual({
    studying: '1:00:37',
    procrastinating: '0:06:12',
  });
  expect(formatReadout({ studying: 0, procrastinating: 3_600_000 })).toEqual({
    studying: '0:00:00',
    procrastinating: '1:00:00',
  });
});

test('speaks durations for screen readers', () => {
  expect(speakDuration(0)).toBe('0 seconds');
  expect(speakDuration(1_000)).toBe('1 second');
  expect(speakDuration(1_477_000)).toBe('24 minutes 37 seconds');
  expect(speakDuration(3_600_000)).toBe('1 hour');
  expect(speakDuration(3_661_000)).toBe('1 hour 1 minute 1 second');
});
