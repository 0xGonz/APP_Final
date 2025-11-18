import { useState } from 'react';
import { History, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

export default function VersionTimeline({ versions, onRollback }) {
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [rollingBack, setRollingBack] = useState(null);

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <History size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No version history available</p>
      </div>
    );
  }

  const handleRollback = async (versionId) => {
    if (!confirm('Are you sure you want to rollback to this version? This will create a new version with the previous data.')) {
      return;
    }

    try {
      setRollingBack(versionId);
      await onRollback?.(versionId);
    } catch (error) {
      console.error('Rollback failed:', error);
    } finally {
      setRollingBack(null);
    }
  };

  const toggleVersion = (id) => {
    setExpandedVersion(expandedVersion === id ? null : id);
  };

  // Group versions by clinic, year, and month
  const groupedVersions = versions.reduce((acc, version) => {
    const key = `${version.clinic.name}-${version.year}-${version.month}`;
    if (!acc[key]) {
      acc[key] = {
        clinic: version.clinic,
        year: version.year,
        month: version.month,
        versions: []
      };
    }
    acc[key].versions.push(version);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.values(groupedVersions).map((group) => (
        <div
          key={`${group.clinic.id}-${group.year}-${group.month}`}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {/* Group Header */}
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-medium text-gray-900">
              {group.clinic.name} - {format(new Date(group.year, group.month - 1), 'MMMM yyyy')}
            </h3>
            <p className="text-sm text-gray-500">
              {group.versions.length} version{group.versions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Timeline */}
          <div className="p-6">
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Version Items */}
              <div className="space-y-6">
                {group.versions.map((version, index) => (
                  <div key={version.id} className="relative pl-12">
                    {/* Timeline Dot */}
                    <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="text-xs font-medium">v{version.version}</span>
                    </div>

                    {/* Version Card */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleVersion(version.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">
                                Version {version.version}
                                {index === 0 && (
                                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                    Current
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                            </p>
                            {version.uploadHistory && (
                              <p className="text-xs text-gray-500 mt-1">
                                From upload: {version.uploadHistory.originalName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {index !== 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRollback(version.id);
                                }}
                                disabled={rollingBack === version.id}
                                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-300 transition flex items-center gap-1"
                              >
                                {rollingBack === version.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                                    Rolling back...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw size={14} />
                                    Rollback
                                  </>
                                )}
                              </button>
                            )}
                            {expandedVersion === version.id ? (
                              <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={20} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedVersion === version.id && (
                        <div className="border-t bg-gray-50 p-4">
                          <h4 className="text-sm font-medium mb-3">Data Snapshot</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white p-3 rounded border">
                              <p className="text-xs text-gray-500">Total Income</p>
                              <p className="text-sm font-medium">
                                ${version.data.totalIncome?.toLocaleString() || '0'}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-xs text-gray-500">Total COGS</p>
                              <p className="text-sm font-medium">
                                ${version.data.totalCOGS?.toLocaleString() || '0'}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-xs text-gray-500">Gross Profit</p>
                              <p className="text-sm font-medium">
                                ${version.data.grossProfit?.toLocaleString() || '0'}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-xs text-gray-500">Net Income</p>
                              <p className="text-sm font-medium">
                                ${version.data.netIncome?.toLocaleString() || '0'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
