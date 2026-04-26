import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';

const supplierIdOf = (bid) => bid.supplierId?._id ?? bid.supplierId;

const BidTable = ({ bids = [] }) => {
  const { user } = useAuth();
  const previousRanks = useRef(new Map());
  const [changedIds, setChangedIds] = useState(new Set());

  const rankedBids = useMemo(
    () =>
      [...bids]
        .sort((a, b) => Number(a.totalAmount ?? 0) - Number(b.totalAmount ?? 0))
        .map((bid, index) => ({ ...bid, rank: bid.rank ?? index + 1 })),
    [bids],
  );

  useEffect(() => {
    const nextChanged = new Set();
    rankedBids.forEach((bid) => {
      const id = bid._id;
      const previous = previousRanks.current.get(id);
      if (previous && previous !== bid.rank) nextChanged.add(id);
      previousRanks.current.set(id, bid.rank);
    });

    if (nextChanged.size) {
      setChangedIds(nextChanged);
      const timeout = window.setTimeout(() => setChangedIds(new Set()), 1200);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [rankedBids]);

  const canSeeCarrier = user?.role === 'buyer';

  return (
    <section className="panel flex h-[380px] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Ranked bids</h2>
        <span className="text-xs text-slate-500">{rankedBids.length} submitted</span>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="table-head">
            <tr>
              <th className="table-cell">Rank</th>
              <th className="table-cell">Carrier</th>
              <th className="table-cell">Freight</th>
              <th className="table-cell">Origin</th>
              <th className="table-cell">Destination</th>
              <th className="table-cell">Total</th>
              <th className="table-cell">Transit</th>
              <th className="table-cell">Validity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rankedBids.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={8}>
                  No bids have been submitted yet.
                </td>
              </tr>
            ) : (
              rankedBids.map((bid, index) => {
                const isL1 = bid.rank === 1 || index === 0;
                const isOwnBid = supplierIdOf(bid) === user?._id;
                const carrierName = canSeeCarrier || isOwnBid ? bid.carrierName : `Supplier ${bid.rank}`;

                return (
                  <tr
                    key={bid._id ?? `${bid.carrierName}-${bid.totalAmount}`}
                    className={`transition ${isL1 ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      } ${isOwnBid ? 'outline outline-2 -outline-offset-2 outline-teal-500/60' : ''} ${changedIds.has(bid._id) ? 'bg-amber-50' : ''
                      }`}
                  >
                    <td className="table-cell font-semibold text-slate-900">
                      <span className="inline-flex items-center gap-1">
                        {isL1 && <Trophy className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
                        L{bid.rank}
                      </span>
                    </td>
                    <td className="table-cell text-slate-700">{carrierName}</td>
                    <td className="table-cell text-slate-600">{formatCurrency(bid.freightCharges)}</td>
                    <td className="table-cell text-slate-600">{formatCurrency(bid.originCharges)}</td>
                    <td className="table-cell text-slate-600">{formatCurrency(bid.destinationCharges)}</td>
                    <td className="table-cell font-semibold text-slate-900">{formatCurrency(bid.totalAmount)}</td>
                    <td className="table-cell text-slate-600">{bid.transitDays ?? '-'} days</td>
                    <td className="table-cell text-slate-600">{formatDate(bid.validityDate, { timeStyle: null })}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default BidTable;
