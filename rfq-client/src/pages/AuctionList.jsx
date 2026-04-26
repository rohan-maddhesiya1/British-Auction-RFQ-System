import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { listAuctions } from '../services/rfq.service';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/formatters';
import AuctionStatusBadge from '../components/AuctionStatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import ErrorState from '../components/ErrorState';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../hooks/useAuth';

const AuctionList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAuctions = async () => {
    setError('');
    try {
      const data = await listAuctions();
      setAuctions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Auctions</h1>
          <p className="mt-1 text-sm text-slate-500">Live RFQs, L1 pricing, close windows, and current status.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" type="button" onClick={loadAuctions}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          {user?.role === 'buyer' && (
            <Link className="btn btn-primary" to="/rfqs/create">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create RFQ
            </Link>
          )}
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? (
        <PageLoader label="Loading auctions" />
      ) : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="table-head">
                <tr>
                  <th className="table-cell">RFQ</th>
                  <th className="table-cell">L1 bid</th>
                  <th className="table-cell">Countdown</th>
                  <th className="table-cell">Forced close</th>
                  <th className="table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {auctions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                      No auctions available yet.
                    </td>
                  </tr>
                ) : (
                  auctions.map((auction) => (
                    <tr
                      key={auction._id}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                      onClick={() => navigate(`/auctions/${auction._id}`)}
                    >
                      <td className="table-cell">
                        <div className="font-semibold text-slate-900">{auction.name}</div>
                        <div className="text-xs text-slate-400">{auction.refId}</div>
                      </td>
                      <td className="table-cell">
                        {auction.l1Bid ? (
                          <div>
                            <div className="font-semibold text-slate-900">{formatCurrency(auction.l1Bid.totalAmount)}</div>
                            <div className="text-xs text-slate-400">{auction.l1Bid.carrierName}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No bids</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <CountdownTimer
                          closeAt={auction.currentCloseAt ?? auction.bidCloseAt}
                          forcedCloseAt={auction.forcedCloseAt}
                          triggerWindowMins={auction.triggerWindowMins}
                        />
                      </td>
                      <td className="table-cell text-slate-600">{formatDate(auction.forcedCloseAt)}</td>
                      <td className="table-cell"><AuctionStatusBadge status={auction.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default AuctionList;
