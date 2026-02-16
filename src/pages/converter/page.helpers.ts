export const get_default_query = (search_params: URLSearchParams): string => {
  const amount_value = search_params.get("amount") ?? "200";
  const from_value = (search_params.get("from") ?? "ZAR").toUpperCase();
  const to_value = (search_params.get("to") ?? "USD").toUpperCase();
  return `${amount_value} ${from_value} in ${to_value}`;
};

export const get_relative_time_label = (
  updated_at: string | null,
  tick: number,
): string => {
  if (!updated_at) return "Updated recently";

  const updated_ms = new Date(updated_at).getTime();
  if (Number.isNaN(updated_ms)) return "Updated recently";

  const diff_seconds = Math.max(0, Math.floor((tick - updated_ms) / 1000));

  if (diff_seconds < 60) {
    const suffix = diff_seconds === 1 ? "" : "s";
    return `Updated ${diff_seconds} second${suffix} ago`;
  }

  const diff_minutes = Math.floor(diff_seconds / 60);
  if (diff_minutes < 60) {
    const suffix = diff_minutes === 1 ? "" : "s";
    return `Updated ${diff_minutes} minute${suffix} ago`;
  }

  const diff_hours = Math.floor(diff_minutes / 60);
  const suffix = diff_hours === 1 ? "" : "s";
  return `Updated ${diff_hours} hour${suffix} ago`;
};

