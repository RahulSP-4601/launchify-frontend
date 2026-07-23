"use client";

export function clampRatio(value: number) {
  return Math.min(Math.max(value, 0), 1);
}
