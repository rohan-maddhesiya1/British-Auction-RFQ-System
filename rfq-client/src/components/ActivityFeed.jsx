import { AlertTriangle, Gavel, History, TimerReset } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const eventIcon = (eventType) => {
  if (eventType === 'AUCTION_EXTENDED') return TimerReset;
  if (eventType === 'AUCTION_CLOSED' || eventType === 'FORCE_CLOSED') return AlertTriangle;
  return Gavel;
};

const eventText = (entry) => {
  if (entry.eventType === 'BID_SUBMITTED') {
    const amount = entry.bid?.totalAmount ?? entry.amount ?? entry.totalAmount;
    const carrier = entry.bid?.carrierName ?? entry.carrierName ?? 'supplier';
    return `New bid ${amount ? `of ${formatCurrency(amount)} ` : ''}from ${carrier}`;
  }

  if (entry.eventType === 'AUCTION_EXTENDED') {
    const duration = entry.extensionDurationMins ? `${entry.extensionDurationMins} mins` : 'configured duration';
    const closeText = entry.newCloseAt ? ` New close: ${formatDate(entry.newCloseAt)}` : '';
    return `Auction extended by ${duration}.${closeText}`;
  }

  if (entry.eventType === 'FORCE_CLOSED') return 'Auction force closed';
  if (entry.eventType === 'AUCTION_CLOSED') return 'Auction closed';
  return entry.reason ?? entry.eventType ?? 'Activity';
};

const ActivityFeed = ({ log = [] }) => (
  <section className="panel flex h-[380px] flex-col overflow-hidden">
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
      <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
    </div>

    <div className="flex-1 overflow-y-auto p-3 no-scrollbar">
      {log.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          Live auction events will appear here.
        </div>
      ) : (
        <ol className="space-y-2">
          {log.map((entry, index) => {
            const Icon = eventIcon(entry.eventType);
            const isClosed = entry.eventType === 'AUCTION_CLOSED' || entry.eventType === 'FORCE_CLOSED';
            const isExtended = entry.eventType === 'AUCTION_EXTENDED';

            return (
              <li
                key={entry._id ?? `${entry.eventType}-${entry.timestamp}-${index}`}
                className={`rounded-md border p-3 ${isClosed
                    ? 'border-rose-200 bg-rose-50'
                    : isExtended
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-100 bg-slate-50'
                  }`}
              >
                <div className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 flex-none text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{eventText(entry)}</p>
                    {entry.reason && <p className="mt-1 text-xs text-slate-600">{entry.reason}</p>}
                    <p className="mt-1 text-xs text-slate-400">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  </section>
);

export default ActivityFeed;
