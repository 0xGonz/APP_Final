import { useState } from 'react';
import { CheckCircle, XCircle, Clock, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function UploadHistoryTable({ uploads, onViewDetails }) {
  const [expandedRow, setExpandedRow] = useState(null);

  if (!uploads || uploads.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No upload history available</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        label: 'Completed',
      },
      completed_with_errors: {
        icon: AlertCircle,
        color: 'bg-orange-100 text-orange-800',
        label: 'Completed with Errors',
      },
      failed: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        label: 'Failed',
      },
      processing: {
        icon: Clock,
        color: 'bg-blue-100 text-blue-800',
        label: 'Processing',
      },
      pending: {
        icon: Clock,
        color: 'bg-gray-100 text-gray-800',
        label: 'Pending',
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-4 py-3"></th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Files
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Records
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded By
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uploads.map((upload) => (
            <>
              <tr
                key={upload.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleRow(upload.id)}
              >
                <td className="px-4 py-4">
                  {expandedRow === upload.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(upload.createdAt), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {upload.metadata?.fileCount || 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {upload.recordsCount || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(upload.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {upload.uploadedBy || 'Anonymous'}
                </td>
              </tr>

              {/* Expanded Row Details */}
              {expandedRow === upload.id && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 bg-gray-50">
                    <div className="space-y-3">
                      {/* File Names */}
                      {upload.metadata?.fileNames && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Files:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {upload.metadata.fileNames.map((fileName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                              >
                                <FileText size={12} />
                                {fileName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {upload.errorMessage && (
                        <div>
                          <h4 className="text-sm font-medium text-red-700 mb-2">
                            Error:
                          </h4>
                          <pre className="text-xs bg-red-50 border border-red-200 rounded p-3 overflow-x-auto max-h-48">
                            {upload.errorMessage}
                          </pre>
                        </div>
                      )}

                      {/* Metadata */}
                      {upload.metadata?.clinicsAffected && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Affected Clinics: {upload.metadata.clinicsAffected.length}
                          </h4>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails?.(upload.id);
                          }}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          View Full Details
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
