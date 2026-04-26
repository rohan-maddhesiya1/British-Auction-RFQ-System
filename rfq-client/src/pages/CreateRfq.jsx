import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import RfqConfigForm from '../components/RfqConfigForm';
import ErrorState from '../components/ErrorState';
import { activateRfq, createRfq } from '../services/rfq.service';
import { datetimeLocalToIso, toDatetimeLocalValue } from '../utils/timeUtils';
import { getErrorMessage } from '../utils/formatters';

const initialForm = {
  name: '',
  refId: '',
  bidStartAt: '',
  bidCloseAt: '',
  forcedCloseAt: '',
  pickupDate: '',
  triggerWindowMins: '5',
  extensionDurationMins: '5',
  triggerType: 'BID_RECEIVED',
};

const normalizeRefId = (value) =>
  value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/:+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase();

const CreateRfq = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const minDateTime = useMemo(() => toDatetimeLocalValue(new Date()), []);

  const update = (field, value) => {
    setError('');
    setNotice('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validationError = useMemo(() => {
    const refId = form.refId.trim();
    if (!refId) return 'Reference ID is required.';
    if (refId.includes(':')) return 'Reference ID cannot contain a colon. Use letters, numbers, hyphens, or underscores.';
    if (!form.bidStartAt || !form.bidCloseAt || !form.forcedCloseAt) return '';
    const start = new Date(form.bidStartAt).getTime();
    const close = new Date(form.bidCloseAt).getTime();
    const forced = new Date(form.forcedCloseAt).getTime();
    if (close <= start) return 'Bid close time must be after bid start time.';
    if (forced <= close) return 'Forced close time must be after bid close time.';
    return '';
  }, [form.bidCloseAt, form.bidStartAt, form.forcedCloseAt, form.refId]);

  const submit = async (event) => {
    event.preventDefault();
    setAttemptedSubmit(true);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const refId = normalizeRefId(form.refId);
      const payload = {
        name: form.name.trim(),
        refId,
        bidStartAt: datetimeLocalToIso(form.bidStartAt),
        bidCloseAt: datetimeLocalToIso(form.bidCloseAt),
        forcedCloseAt: datetimeLocalToIso(form.forcedCloseAt),
        pickupDate: form.pickupDate ? datetimeLocalToIso(form.pickupDate) : undefined,
        triggerWindowMins: Number(form.triggerWindowMins),
        extensionDurationMins: Number(form.extensionDurationMins),
        triggerType: form.triggerType,
      };

      const rfq = await createRfq(payload);
      try {
        await activateRfq(rfq._id);
      } catch (activationError) {
        // sometimes the queue scheduler fails, so we catch this and let the user know
        // the rfq is saved as a draft at least.
        const message = getErrorMessage(activationError);
        if (message.toLowerCase().includes('custom id cannot contain')) {
          setNotice('RFQ was created as a draft, but activation failed in the queue scheduler. Open the RFQ after the backend activation issue is fixed.');
          navigate(`/auctions/${rfq._id}`, {
            state: {
              notice: 'RFQ was created as a draft, but activation failed in the queue scheduler.',
            },
          });
          return;
        }
        throw activationError;
      }
      navigate(`/auctions/${rfq._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create RFQ</h1>
        <p className="mt-1 text-sm text-slate-500">Configure the bid window, hard close, and British Auction extension rules.</p>
      </div>

      {(error || (attemptedSubmit ? validationError : '')) && <ErrorState message={error || validationError} />}
      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {notice}
        </div>
      )}

      <form className="panel p-5" onSubmit={submit}>
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">RFQ name</span>
              <input className="input" value={form.name} onChange={(event) => update('name', event.target.value)} required />
            </label>

            <label>
              <span className="field-label">Reference ID</span>
              <input
                className="input"
                value={form.refId}
                onBlur={(event) => update('refId', normalizeRefId(event.target.value))}
                onChange={(event) => update('refId', event.target.value)}
                placeholder="RFQ-IT-001"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="field-label">Bid start</span>
              <input className="input" type="datetime-local" min={minDateTime} value={form.bidStartAt} onChange={(event) => update('bidStartAt', event.target.value)} required />
            </label>

            <label>
              <span className="field-label">Bid close</span>
              <input className="input" type="datetime-local" min={form.bidStartAt || minDateTime} value={form.bidCloseAt} onChange={(event) => update('bidCloseAt', event.target.value)} required />
            </label>

            <label>
              <span className="field-label">Forced close</span>
              <input className="input" type="datetime-local" min={form.bidCloseAt || minDateTime} value={form.forcedCloseAt} onChange={(event) => update('forcedCloseAt', event.target.value)} required />
            </label>

            <label>
              <span className="field-label">Pickup / service date</span>
              <input className="input" type="datetime-local" min={minDateTime} value={form.pickupDate} onChange={(event) => update('pickupDate', event.target.value)} />
            </label>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Auction rules</h2>
            <RfqConfigForm value={form} onChange={setForm} />
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {submitting ? 'Creating' : 'Create and activate'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateRfq;
