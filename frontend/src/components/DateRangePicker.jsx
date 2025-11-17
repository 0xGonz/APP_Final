import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onDateChange, minDate, maxDate }) => {
  const [localStartDate, setLocalStartDate] = useState(
    startDate || format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')
  );
  const [localEndDate, setLocalEndDate] = useState(
    endDate || format(new Date(), 'yyyy-MM-dd')
  );

  const handleApply = () => {
    onDateChange(localStartDate, localEndDate);
  };

  const handleReset = () => {
    const defaultStart = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
    const defaultEnd = format(new Date(), 'yyyy-MM-dd');
    setLocalStartDate(defaultStart);
    setLocalEndDate(defaultEnd);
    onDateChange(defaultStart, defaultEnd);
  };

  const handlePreset = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case 'ytd':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case 'last-year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'last-6-months':
        start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        end = today;
        break;
      case 'last-12-months':
        start = new Date(today.getFullYear(), today.getMonth() - 12, 1);
        end = today;
        break;
      case 'all-time':
        start = minDate ? new Date(minDate) : new Date(2023, 0, 1);
        end = maxDate ? new Date(maxDate) : today;
        break;
      default:
        return;
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    onDateChange(startStr, endStr);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary-600" />
        <h3 className="font-medium text-gray-900">Date Range</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            min={minDate}
            max={localEndDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => setLocalEndDate(e.target.value)}
            min={localStartDate}
            max={maxDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Select</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePreset('ytd')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            YTD
          </button>
          <button
            onClick={() => handlePreset('last-year')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Last Year
          </button>
          <button
            onClick={() => handlePreset('last-6-months')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Last 6 Months
          </button>
          <button
            onClick={() => handlePreset('last-12-months')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Last 12 Months
          </button>
          <button
            onClick={() => handlePreset('all-time')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            All Time
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
