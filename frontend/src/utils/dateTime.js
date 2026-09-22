/**
 * Shared timestamp formatting utilities for the Datastraw CRM frontend.
 *
 * All timestamps from the API are UTC ISO-8601 strings (ending in +00:00 or Z).
 * We display them converted to Asia/Kolkata (IST) so the UI is always in IST,
 * regardless of whether the user's browser or the server is in a different timezone.
 *
 * Do NOT manually add/subtract 5:30. Use the timeZone option in Intl/toLocale*.
 */

const DISPLAY_TIMEZONE = "Asia/Kolkata";

/**
 * Parse any timestamp string from the API into a Date object.
 * Handles both ISO-8601 with tz info (e.g. "...+00:00") and legacy naive strings
 * that SQLite returns without a tz suffix — treated as UTC per backend convention.
 */
export function parseTimestamp(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();
  if (!str) return null;

  // Normalize SQLite space separator → T
  let normalized = str.includes(" ") && !str.includes("T")
    ? str.replace(" ", "T")
    : str;

  // If no timezone suffix is present, treat as UTC (backend stores UTC-naive values)
  if (!/[Zz]$/.test(normalized) && !/[+-]\d{2}:\d{2}$/.test(normalized)) {
    normalized += "Z";
  }

  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a timestamp as a short date string in IST.
 * e.g. "Sep 22, 2026"
 */
export function formatDate(val) {
  const d = parseTimestamp(val);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a timestamp as a time string in IST.
 * e.g. "04:15 PM"
 */
export function formatTime(val) {
  const d = parseTimestamp(val);
  if (!d) return "";
  return d.toLocaleTimeString("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a timestamp as a combined date + time string in IST.
 * e.g. "Sep 22, 2026, 04:15 PM"
 */
export function formatDateTime(val) {
  const d = parseTimestamp(val);
  if (!d) return "";
  return d.toLocaleString("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
