/**
 * Utility to format timestamp into human-readable relative/absolute time.
 */
export function formatPostDate(createdAt?: number): string {
  if (!createdAt) return "Just now";
  const now = Date.now();
  const diff = now - createdAt;

  // Handle hypothetical time drifts
  if (diff < 0) return "Just now";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    // Absolute date
    const d = new Date(createdAt);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
}
