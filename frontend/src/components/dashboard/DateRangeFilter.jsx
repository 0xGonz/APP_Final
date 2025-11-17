import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useDateFilter } from '../../context/DateFilterContext';

/**
 * Date Range Filter Component
 * Connected to global DateFilterContext
 * Provides preset options and custom date range
 * Used across Dashboard and Clinic views for consistent date filtering
 */
const DateRangeFilter = () => {
  const {
    startDate,
    endDate,
    selectedPreset,
    presets,
    applyPreset,
    updateDateRange,
    setStartDate: setGlobalStartDate,
    setEndDate: setGlobalEndDate,
  } = useDateFilter();

  const [showCustom, setShowCustom] = useState(selectedPreset === 'custom');
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handlePresetChange = (presetId) => {
    setShowCustom(presetId === 'custom');
    if (presetId !== 'custom') {
      applyPreset(presetId);
    }
  };

  const handleCustomDateChange = () => {
    if (customStart && customEnd) {
      updateDateRange(customStart, customEnd, 'custom');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetChange(preset.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPreset === preset.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {showCustom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <button
              onClick={handleCustomDateChange}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Apply Custom Range
            </button>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Selected Period:{' '}
          <span className="font-semibold text-gray-900">
            {startDate && endDate ? (
              <>
                {format(parseISO(startDate), 'MMM d, yyyy')} -{' '}
                {format(parseISO(endDate), 'MMM d, yyyy')}
              </>
            ) : (
              'Loading...'
            )}
          </span>
        </p>
      </div>
    </div>
  );
};

export default DateRangeFilter;
