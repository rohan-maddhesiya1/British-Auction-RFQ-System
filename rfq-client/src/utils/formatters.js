export const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'INR 0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (value, options = {}) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const formatterOptions = {
    dateStyle: options.dateStyle ?? 'medium',
  };

  if (options.timeStyle !== null) {
    formatterOptions.timeStyle = options.timeStyle ?? 'short';
  }

  return new Intl.DateTimeFormat('en-IN', formatterOptions).format(date);
};

export const formatDuration = (ms) => {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
};

export const getErrorMessage = (error) => {
  const payload = error?.response?.data;
  if (payload?.error) return payload.error;
  if (Array.isArray(payload?.errors)) return payload.errors.map((item) => item.msg).join(', ');
  return error?.message || 'Something went wrong';
};
