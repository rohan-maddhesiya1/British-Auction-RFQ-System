const statusStyles = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  draft: 'border-slate-200 bg-slate-100 text-slate-600',
  closed: 'border-rose-200 bg-rose-50 text-rose-700',
  force_closed: 'border-rose-200 bg-rose-50 text-rose-700',
};

const labels = {
  active: 'Active',
  draft: 'Draft',
  closed: 'Closed',
  force_closed: 'Force closed',
};

const AuctionStatusBadge = ({ status }) => {
  const key = status ?? 'draft';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[key] ?? statusStyles.draft}`}>
      {labels[key] ?? key}
    </span>
  );
};

export default AuctionStatusBadge;
