export function formatDuration(minutes: number): string {
  const seconds = minutes * 60;
  if (seconds === 0) return '0s';
  const units = [
    { label: 'yr', secs: 365 * 24 * 3600 },
    { label: 'd', secs: 24 * 3600 },
    { label: 'h', secs: 3600 },
    { label: 'min', secs: 60 },
    { label: 's', secs: 1 },
  ];
  for (const unit of units) {
    if (seconds >= unit.secs) {
      const value = Math.floor(seconds / unit.secs);
      return `${value||0}${unit.label}`;
    }
  }
  return `${seconds||0}s`;
}
