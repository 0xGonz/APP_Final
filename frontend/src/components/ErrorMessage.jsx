import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-danger-900">Error</h3>
          <p className="mt-1 text-sm text-danger-700">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 btn-secondary text-danger-700 border-danger-300 hover:bg-danger-50"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
