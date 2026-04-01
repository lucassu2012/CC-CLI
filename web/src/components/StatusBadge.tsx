interface StatusBadgeProps {
  status: 'active' | 'idle' | 'error' | 'warning' | 'normal' | 'fault' | 'degraded' | 'down' | 'running' | 'completed' | 'failed' | 'queued';
  size?: 'sm' | 'md';
}

const colorMap: Record<string, string> = {
  active: 'bg-status-green',
  normal: 'bg-status-green',
  completed: 'bg-status-green',
  running: 'bg-accent-cyan',
  idle: 'bg-text-muted',
  queued: 'bg-text-muted',
  warning: 'bg-status-yellow',
  degraded: 'bg-status-yellow',
  error: 'bg-status-red',
  fault: 'bg-status-red',
  failed: 'bg-status-red',
  down: 'bg-status-red',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const color = colorMap[status] || 'bg-text-muted';
  const shouldPulse = status === 'active' || status === 'running' || status === 'error' || status === 'fault';

  return (
    <span className="relative inline-flex">
      <span className={`${sizeClass} rounded-full ${color}`} />
      {shouldPulse && (
        <span className={`absolute inset-0 ${sizeClass} rounded-full ${color} opacity-50 animate-ping`} />
      )}
    </span>
  );
}
