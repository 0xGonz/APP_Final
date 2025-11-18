import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, History, Database } from 'lucide-react';
import { uploadAPI } from '../services/api';
import { useUploadProgress } from '../hooks/useWebSocket';
import CSVUploadModal from '../components/upload/CSVUploadModal';
import UploadProgress from '../components/upload/UploadProgress';
import ValidationErrors from '../components/upload/ValidationErrors';
import UploadHistoryTable from '../components/upload/UploadHistoryTable';
import VersionTimeline from '../components/upload/VersionTimeline';

export default function DataManagement() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'versions'
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const queryClient = useQueryClient();
  const { isConnected, uploadProgress, getProgress } = useUploadProgress();

  // Fetch upload history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['uploadHistory'],
    queryFn: () => uploadAPI.getHistory({ limit: 50 }),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch version history
  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', selectedClinic],
    queryFn: () => {
      if (!selectedClinic) return Promise.resolve({ data: [] });
      return uploadAPI.getVersions(selectedClinic);
    },
    enabled: activeTab === 'versions',
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: ({ uploadId, versionId }) => uploadAPI.rollback(uploadId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['uploadHistory']);
      queryClient.invalidateQueries(['versions']);
      queryClient.invalidateQueries(['financials']);
      alert('Rollback completed successfully!');
    },
    onError: (error) => {
      alert(`Rollback failed: ${error.message}`);
    },
  });

  const handleUploadStart = (uploadId) => {
    setCurrentUploadId(uploadId);
    queryClient.invalidateQueries(['uploadHistory']);
  };

  const handleRollback = async (versionId) => {
    // Get upload ID from version (you might need to adjust this based on your data structure)
    const version = versionsData?.data?.find((v) => v.id === versionId);
    if (version?.uploadHistoryId) {
      rollbackMutation.mutate({
        uploadId: version.uploadHistoryId,
        versionId,
      });
    }
  };

  const currentProgress = currentUploadId ? getProgress(currentUploadId) : null;
  const uploads = historyData?.data || [];
  const versions = versionsData?.data || [];

  // Get validation errors from current upload if failed
  const validationErrors = currentProgress?.result?.errors || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Data Management
        </h1>
        <p className="text-gray-600">
          Upload and manage clinic financial data
        </p>
      </div>

      {/* WebSocket Status */}
      <div className="mb-6 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Real-time updates enabled' : 'Connecting...'}
        </span>
      </div>

      {/* Upload Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Upload size={20} />
          Upload CSV Files
        </button>
      </div>

      {/* Current Upload Progress */}
      {currentProgress && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Current Upload</h2>
          <UploadProgress progress={currentProgress} />
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6">
          <ValidationErrors errors={validationErrors} />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <History size={18} />
            Upload History
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition ${
              activeTab === 'versions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database size={18} />
            Version History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Uploads</h2>
            {uploads.length > 0 && (
              <p className="text-sm text-gray-500">
                Showing {uploads.length} uploads
              </p>
            )}
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <UploadHistoryTable
              uploads={uploads}
              onViewDetails={(uploadId) => {
                // Could implement a modal or navigate to details page
                console.log('View details for upload:', uploadId);
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'versions' && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3">Version History</h2>
            <p className="text-sm text-gray-600 mb-4">
              View and rollback to previous versions of your data
            </p>

            {/* Clinic Filter - You might want to fetch clinics from API */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Clinic (optional)
              </label>
              <select
                value={selectedClinic || ''}
                onChange={(e) => setSelectedClinic(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Clinics</option>
                {/* You would populate this from a clinics query */}
              </select>
            </div>
          </div>

          {versionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <VersionTimeline
              versions={versions}
              onRollback={handleRollback}
            />
          )}
        </div>
      )}

      {/* Upload Modal */}
      <CSVUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadStart={handleUploadStart}
      />
    </div>
  );
}
