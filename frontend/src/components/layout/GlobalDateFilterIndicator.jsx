import { format, parseISO } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDateFilter } from '../../context/DateFilterContext';
import { useState } from 'react';

/**
 * Global Date Filter Indicator
 * Compact component showing current date range
 * Can be placed in header/sidebar for always-visible date context
 */
const GlobalDateFilterIndicator = ({ compact = false }) => {
  const { startDate, endDate, selectedPreset, presets, applyPreset, updateDateRange } = useDateFilter();
  const [showMenu, setShowMenu] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(startDate);
  const [customEndDate, setCustomEndDate] = useState(endDate);

  const selectedPresetLabel = presets.find((p) => p.id === selectedPreset)?.label || 'Custom Range';

  const formattedRange = startDate && endDate
    ? `${format(parseISO(startDate), 'MMM d, yyyy')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`
    : 'Loading...';

  const handleApplyCustomRange = () => {
    updateDateRange(customStartDate, customEndDate, 'custom');
    setShowCustomPicker(false);
    setShowMenu(false);
  };

  const handleOpenCustomPicker = () => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setShowCustomPicker(true);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm ${
          compact ? 'text-xs' : ''
        }`}
      >
        <Calendar className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600`} />
        <div className="flex flex-col items-start">
          <span className="font-semibold text-gray-900">{selectedPresetLabel}</span>
          {!compact && (
            <span className="text-xs text-gray-500">{formattedRange}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {/* Quick Preset Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="py-1">
              <div className="px-3 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quick Select
                </p>
              </div>
              {presets.filter(p => p.id !== 'custom').map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    applyPreset(preset.id);
                    setShowMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                    selectedPreset === preset.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <div className="border-t border-gray-200 mt-1">
                <button
                  onClick={() => {
                    handleOpenCustomPicker();
                    setShowMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                    selectedPreset === 'custom'
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  Custom Range...
                </button>
              </div>
              <div className="border-t border-gray-200 pt-1">
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500">Current Selection:</p>
                  <p className="text-xs font-medium text-gray-900 mt-1">
                    {formattedRange}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Date Range Picker Modal */}
      {showCustomPicker && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowCustomPicker(false)}
          />
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Custom Date Range
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCustomRange}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalDateFilterIndicator;
