import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { getAuction } from '../services/rfq.service';
import { formatDate, getErrorMessage } from '../utils/formatters';
import { useAuctionSocket } from '../hooks/useAuctionSocket';
import { useAuth } from '../hooks/useAuth';
import ActivityFeed from '../components/ActivityFeed';
import AuctionStatusBadge from '../components/AuctionStatusBadge';
import BidTable from '../components/BidTable';
import CountdownTimer from '../components/CountdownTimer';
import ErrorState from '../components/ErrorState';
import PageLoader from '../components/PageLoader';

const AuctionDetail = () => {
  const { rfqId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAuction(rfqId)
      .then((data) => {
        if (alive) setInitialData(data);
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [rfqId]);

  const live = useAuctionSocket(rfqId, initialData);
  const rfq = live.rfq ?? initialData?.rfq;
  const config = live.config ?? initialData?.config;
  const bids = live.bids ?? initialData?.bids ?? [];
  const log = live.log ?? initialData?.log ?? [];
  const status = live.status ?? rfq?.status;

  const triggerLabel = useMemo(() => {
    const labels = {
      BID_RECEIVED: 'Bid received',
      ANY_RANK_CHANGE: 'Any rank change',
      L1_RANK_CHANGE: 'L1 rank change',
    };
    return labels[config?.triggerType] ?? config?.triggerType ?? '-';
  }, [config?.triggerType]);

  if (loading) return <PageLoader label="Loading auction" />;

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to="/auctions">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to auctions
      </Link>

      {error && <ErrorState message={error} />}
      {location.state?.notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {location.state.notice}
        </div>
      )}

      {rfq && (
        <>
          <section className="panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <AuctionStatusBadge status={status} />
                  <span className="text-xs font-medium text-slate-500">{rfq.refId}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{rfq.name}</h1>
                <p className="mt-2 text-sm text-slate-500">Forced close: {formatDate(rfq.forcedCloseAt)}</p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <CountdownTimer
                  closeAt={live.closeAt ?? config?.currentCloseAt ?? rfq.bidCloseAt}
                  forcedCloseAt={rfq.forcedCloseAt}
                  triggerWindowMins={config?.triggerWindowMins}
                  size="large"
                />
                {user?.role === 'supplier' && status === 'active' && (
                  <Link className="btn btn-primary" to={`/rfqs/${rfq._id}/bid`}>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Submit bid
                  </Link>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <BidTable bids={bids} />
            <ActivityFeed log={log} />
          </div>

          <section className="panel p-5">
            <h2 className="text-sm font-semibold text-slate-900">Auction configuration</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Bid start</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(rfq.bidStartAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Initial close</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(rfq.bidCloseAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">X window</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{config?.triggerWindowMins ?? '-'} mins</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Y extension</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{config?.extensionDurationMins ?? '-'} mins</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Trigger</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{triggerLabel}</dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </div>
  );
};

export default AuctionDetail;
