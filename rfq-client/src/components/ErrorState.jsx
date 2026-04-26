import { AlertCircle } from 'lucide-react';

const ErrorState = ({ message }) => (
  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
    <div className="flex gap-2">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      <span>{message}</span>
    </div>
  </div>
);

export default ErrorState;
