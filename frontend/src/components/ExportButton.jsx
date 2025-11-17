import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ExportButton = ({
  clinicId = null,
  year = null,
  startDate = null,
  endDate = null,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      let response;
      const params = {
        clinicId,
        year,
        startDate,
        endDate,
      };

      // Remove null/undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      if (format === 'excel') {
        response = await axios.post(`${API_BASE_URL}/export/excel`, params, {
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `financial-report-${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        response = await axios.post(`${API_BASE_URL}/export/pdf`, params, {
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `financial-report-${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const queryParams = new URLSearchParams(params).toString();
        response = await axios.get(`${API_BASE_URL}/export/csv?${queryParams}`, {
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `financial-data-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors ${className}`}
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-red-600" />
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <File className="w-4 h-4 text-blue-600" />
                Export as CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
