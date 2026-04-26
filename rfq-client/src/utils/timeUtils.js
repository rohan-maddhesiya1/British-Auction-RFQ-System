export const toMs = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

export const applySkew = (closeAt, skew = 0) => {
  const closeAtMs = toMs(closeAt);
  if (!closeAtMs) return 0;
  return closeAtMs - (Date.now() + skew);
};

export const toDatetimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const datetimeLocalToIso = (value) => {
  if (!value) return '';
  return new Date(value).toISOString();
};
