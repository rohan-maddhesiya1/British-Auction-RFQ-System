import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDuration } from '../utils/formatters';
import { applySkew, toMs } from '../utils/timeUtils';
import { useServerTime } from '../hooks/useServerTime';

const CountdownTimer = ({ closeAt, forcedCloseAt, triggerWindowMins, size = 'normal' }) => {
  const { skew } = useServerTime();
  const [remaining, setRemaining] = useState(() => applySkew(closeAt, skew));

  useEffect(() => {
    setRemaining(applySkew(closeAt, skew));
    const timer = window.setInterval(() => {
      setRemaining(applySkew(closeAt, skew));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [closeAt, skew]);

  const forcedMs = toMs(forcedCloseAt);
  const forcedRemaining = forcedMs ? forcedMs - (Date.now() + skew) : null;

  const warningAt = Number(triggerWindowMins ?? 0) * 60 * 1000;
  const isClosed = remaining <= 0;
  const isCritical = remaining > 0 && remaining < 60 * 1000;
  const isWarning = remaining > 0 && warningAt > 0 && remaining <= warningAt;

  const tone = isClosed
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : isCritical
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : isWarning
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-teal-200 bg-teal-50 text-teal-700';

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${tone}`}>
      <Clock className={size === 'large' ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
      <span className={size === 'large' ? 'text-2xl font-bold tabular-nums' : 'font-semibold tabular-nums'}>
        {isClosed ? 'CLOSED' : formatDuration(remaining)}
      </span>
      {forcedRemaining !== null && forcedRemaining > 0 && (
        <span className="hidden text-xs text-current/75 sm:inline">Hard close {formatDuration(forcedRemaining)}</span>
      )}
    </div>
  );
};

export default CountdownTimer;
