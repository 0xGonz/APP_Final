import { AlertTriangle, FileText, XCircle } from 'lucide-react';

export default function ValidationErrors({ errors }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-red-600" />
        <h3 className="font-semibold text-red-900">
          Validation Errors ({errors.length})
        </h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {errors.map((error, index) => (
          <div
            key={index}
            className="bg-white border border-red-200 rounded-lg p-3"
          >
            {/* File Name */}
            {error.file && (
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-red-600" />
                <span className="text-sm font-medium text-gray-900">
                  {error.file}
                </span>
              </div>
            )}

            {/* Record Info */}
            {error.record && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">Record:</span> {error.record}
              </p>
            )}

            {/* Error Message */}
            <div className="flex items-start gap-2">
              <XCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error.error}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
