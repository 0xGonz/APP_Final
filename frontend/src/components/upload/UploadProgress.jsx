import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';

export default function UploadProgress({ progress }) {
  if (!progress) return null;

  const { status, progress: percentage, currentFile, recordsProcessed, message, error, result } = progress;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'failed':
        return <XCircle size={24} className="text-red-600" />;
      case 'processing':
        return <Loader size={24} className="text-blue-600 animate-spin" />;
      default:
        return <Loader size={24} className="text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-medium capitalize">{status}</h3>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </div>

      {/* Progress Bar */}
      {status !== 'completed' && status !== 'failed' && percentage !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Current File */}
      {currentFile && (
        <p className="text-sm text-gray-600 mb-2">
          Processing: <span className="font-medium">{currentFile}</span>
        </p>
      )}

      {/* Records Processed */}
      {recordsProcessed !== undefined && recordsProcessed > 0 && (
        <p className="text-sm text-gray-600">
          Records processed: <span className="font-medium">{recordsProcessed}</span>
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Result */}
      {status === 'completed' && result && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Records Processed</p>
            <p className="text-lg font-semibold text-gray-900">{result.recordsProcessed || 0}</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Files Processed</p>
            <p className="text-lg font-semibold text-gray-900">{result.filesProcessed || 0}</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Clinics Affected</p>
            <p className="text-lg font-semibold text-gray-900">{result.clinicsAffected || 0}</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Errors</p>
            <p className="text-lg font-semibold text-gray-900">{result.errors?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
