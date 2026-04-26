import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import ErrorState from '../components/ErrorState';
import PageLoader from '../components/PageLoader';
import AuctionStatusBadge from '../components/AuctionStatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import { getAuction } from '../services/rfq.service';
import { submitBid } from '../services/bid.service';
import { datetimeLocalToIso, toDatetimeLocalValue } from '../utils/timeUtils';
import { formatDate, getErrorMessage } from '../utils/formatters';

const initialBid = {
  carrierName: '',
  freightCharges: '',
  originCharges: '',
  destinationCharges: '',
  totalAmount: '',
  transitDays: '',
  validityDate: '',
};

const toNumber = (value) => Number(value || 0);

const SubmitBid = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [form, setForm] = useState(initialBid);
  const [totalTouched, setTotalTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const minDateTime = useMemo(() => toDatetimeLocalValue(new Date()), []);

  const calculatedTotal = useMemo(
    () => toNumber(form.freightCharges) + toNumber(form.originCharges) + toNumber(form.destinationCharges),
    [form.destinationCharges, form.freightCharges, form.originCharges],
  );

  useEffect(() => {
    if (!totalTouched) {
      setForm((current) => ({ ...current, totalAmount: calculatedTotal ? String(calculatedTotal) : '' }));
    }
  }, [calculatedTotal, totalTouched]);

  useEffect(() => {
    let alive = true;
    getAuction(rfqId)
      .then((data) => {
        if (alive) setAuction(data);
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

  const update = (field, value) => {
    if (field === 'totalAmount') setTotalTouched(true);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await submitBid({
        rfqId,
        carrierName: form.carrierName,
        freightCharges: Number(form.freightCharges),
        originCharges: Number(form.originCharges || 0),
        destinationCharges: Number(form.destinationCharges || 0),
        totalAmount: Number(form.totalAmount),
        transitDays: Number(form.transitDays),
        validityDate: form.validityDate ? datetimeLocalToIso(form.validityDate) : undefined,
      });
      navigate(`/auctions/${rfqId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader label="Loading bid form" />;

  const rfq = auction?.rfq;
  const config = auction?.config;
  const isActive = rfq?.status === 'active';

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to={`/auctions/${rfqId}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to auction
      </Link>

      {error && <ErrorState message={error} />}

      {rfq && (
        <section className="panel p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <AuctionStatusBadge status={rfq.status} />
                <span className="text-xs text-slate-500">{rfq.refId}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{rfq.name}</h1>
              <p className="mt-1 text-sm text-slate-500">Forced close: {formatDate(rfq.forcedCloseAt)}</p>
            </div>
            <CountdownTimer closeAt={config?.currentCloseAt ?? rfq.bidCloseAt} forcedCloseAt={rfq.forcedCloseAt} triggerWindowMins={config?.triggerWindowMins} />
          </div>
        </section>
      )}

      <form className="panel p-5" onSubmit={submit}>
        <fieldset disabled={!isActive || submitting} className="grid gap-5 disabled:opacity-60">
          {!isActive && <ErrorState message="This auction is not active, so bids cannot be submitted." />}

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Carrier name</span>
              <input className="input" value={form.carrierName} onChange={(event) => update('carrierName', event.target.value)} required />
            </label>

            <label>
              <span className="field-label">Transit time (days)</span>
              <input className="input" min="0" type="number" value={form.transitDays} onChange={(event) => update('transitDays', event.target.value)} required />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="field-label">Freight charges</span>
              <input className="input" min="0" step="0.01" type="number" value={form.freightCharges} onChange={(event) => update('freightCharges', event.target.value)} required />
            </label>

            <label>
              <span className="field-label">Origin charges</span>
              <input className="input" min="0" step="0.01" type="number" value={form.originCharges} onChange={(event) => update('originCharges', event.target.value)} />
            </label>

            <label>
              <span className="field-label">Destination charges</span>
              <input className="input" min="0" step="0.01" type="number" value={form.destinationCharges} onChange={(event) => update('destinationCharges', event.target.value)} />
            </label>

            <label>
              <span className="field-label">Total amount</span>
              <input className="input" min="0" step="0.01" type="number" value={form.totalAmount} onChange={(event) => update('totalAmount', event.target.value)} required />
            </label>
          </div>

          <label className="max-w-sm">
            <span className="field-label">Validity of quote</span>
            <input className="input" type="datetime-local" min={minDateTime} value={form.validityDate} onChange={(event) => update('validityDate', event.target.value)} required />
          </label>

          <div className="flex justify-end">
            <button className="btn btn-primary" type="submit" disabled={!isActive || submitting}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitting ? 'Submitting' : 'Submit bid'}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default SubmitBid;
