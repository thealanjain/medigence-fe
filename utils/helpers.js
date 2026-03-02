/**
 * Format a date string into a human-readable time or date.
 */
export function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Extract error message from axios error.
 */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong'
  );
}

/**
 * Get initials from a name string.
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}
