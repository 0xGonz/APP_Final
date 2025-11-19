import { createContext, useContext, useState, useEffect } from 'react';
import { format, startOfYear, subYears, subMonths, startOfQuarter, subQuarters, startOfMonth } from 'date-fns';
import { systemAPI } from '../services/api';

/**
 * Global Date Filter Context
 *
 * Provides universal date range filtering across all pages
 * Persists to localStorage for consistent experience
 * Uses latest available data date for intelligent date range calculations
 */

const DateFilterContext = createContext(null);

// Storage keys
const STORAGE_KEYS = {
  START_DATE: 'app_filter_start_date',
  END_DATE: 'app_filter_end_date',
  PRESET: 'app_filter_preset',
  SELECTED_CLINIC: 'app_filter_selected_clinic',
  SELECTED_CLINICS: 'app_filter_selected_clinics',
};

// Migration key - change this to force re-migration for all users
const MIGRATION_KEY = 'app_filter_migrated_v4_nov2025';

export const DateFilterProvider = ({ children }) => {
  // Latest available data date (fetched from backend)
  const [latestDataDate, setLatestDataDate] = useState(null);
  const [isLoadingDataDate, setIsLoadingDataDate] = useState(true);

  // Initialize from localStorage (null if not found - will be set after fetching latestDataDate)
  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.START_DATE) || null;
  });

  const [endDate, setEndDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.END_DATE) || null;
  });

  const [selectedPreset, setSelectedPreset] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.PRESET) || 'ytd';
  });

  // Clinic filter state (for Analytics page - single selection)
  const [selectedClinic, setSelectedClinic] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CLINIC) || 'all';
  });

  // Clinic filters state (for Comparison page - multiple selection)
  const [selectedClinics, setSelectedClinics] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_CLINICS);
    return stored ? JSON.parse(stored) : [];
  });

  // Fetch the latest available data date from the backend
  useEffect(() => {
    const fetchLatestDataDate = async () => {
      try {
        const data = await systemAPI.getDataRange();
        // Handle date string with timezone fix
        const dateStr = typeof data.latest.date === 'string' && data.latest.date.includes('T')
          ? data.latest.date.split('T')[0] + 'T00:00:00'
          : data.latest.date + 'T00:00:00';
        const latestDate = new Date(dateStr);
        setLatestDataDate(latestDate);
        console.log('📅 Latest data date:', format(latestDate, 'MMM d, yyyy'));
      } catch (error) {
        console.error('Failed to fetch latest data date:', error);
        // Fallback to today's date if API fails
        setLatestDataDate(new Date());
      } finally {
        setIsLoadingDataDate(false);
      }
    };
    fetchLatestDataDate();
  }, []);

  // Refetch latest date when user returns to tab (makes system dynamic)
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const data = await systemAPI.getDataRange();
        const dateStr = typeof data.latest.date === 'string' && data.latest.date.includes('T')
          ? data.latest.date.split('T')[0] + 'T00:00:00'
          : data.latest.date + 'T00:00:00';
        const newLatestDate = new Date(dateStr);

        // Only update if date changed
        if (latestDataDate?.getTime() !== newLatestDate.getTime()) {
          setLatestDataDate(newLatestDate);
          console.log('📅 Updated latest data date:', format(newLatestDate, 'MMM d, yyyy'));
        }
      } catch (error) {
        console.error('Failed to refetch latest data date:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [latestDataDate]);

  // Force migration and initialize dates after fetching latestDataDate
  useEffect(() => {
    if (!latestDataDate) return;

    const hasMigrated = localStorage.getItem(MIGRATION_KEY);

    // FORCE migration if not done yet (clears all Nov dates)
    if (!hasMigrated) {
      console.log('🔄 Running one-time migration - clearing old hardcoded dates');

      // Clear ALL old localStorage date data
      localStorage.removeItem(STORAGE_KEYS.START_DATE);
      localStorage.removeItem(STORAGE_KEYS.END_DATE);
      localStorage.setItem(MIGRATION_KEY, 'true');

      // Force apply YTD with latest data
      const ytdPreset = {
        start: format(startOfYear(latestDataDate), 'yyyy-MM-dd'),
        end: format(latestDataDate, 'yyyy-MM-dd'),
      };
      setStartDate(ytdPreset.start);
      setEndDate(ytdPreset.end);
      setSelectedPreset('ytd');

      console.log('✅ Migration complete - Applied YTD:', ytdPreset.start, 'to', ytdPreset.end);
      return;
    }

    // If migration already done, check for first load (no dates)
    if (!startDate || !endDate) {
      const ytdPreset = {
        start: format(startOfYear(latestDataDate), 'yyyy-MM-dd'),
        end: format(latestDataDate, 'yyyy-MM-dd'),
      };
      setStartDate(ytdPreset.start);
      setEndDate(ytdPreset.end);
      setSelectedPreset('ytd');
      console.log('📅 First load - Applied YTD with latest data date');
    }
  }, [latestDataDate, startDate, endDate]);

  // Persist to localStorage whenever values change (skip if null)
  useEffect(() => {
    if (startDate) localStorage.setItem(STORAGE_KEYS.START_DATE, startDate);
    if (endDate) localStorage.setItem(STORAGE_KEYS.END_DATE, endDate);
    if (selectedPreset) localStorage.setItem(STORAGE_KEYS.PRESET, selectedPreset);
    if (selectedClinic) localStorage.setItem(STORAGE_KEYS.SELECTED_CLINIC, selectedClinic);
    localStorage.setItem(STORAGE_KEYS.SELECTED_CLINICS, JSON.stringify(selectedClinics));
  }, [startDate, endDate, selectedPreset, selectedClinic, selectedClinics]);

  // Preset configurations (using latest available data date)
  const currentDate = latestDataDate || new Date();

  const presets = [
    {
      id: 'all-time',
      label: 'All Time',
      getRange: () => ({
        start: '2023-01-01',
        end: format(currentDate, 'yyyy-MM-dd'),
      }),
    },
    {
      id: 'ytd',
      label: 'Year to Date',
      getRange: () => ({
        start: format(startOfYear(currentDate), 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      }),
    },
    {
      id: 'mtd',
      label: 'Month to Date',
      getRange: () => ({
        start: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      }),
    },
    {
      id: 'last-6-months',
      label: 'Last 6 Months',
      getRange: () => ({
        start: format(startOfMonth(subMonths(currentDate, 5)), 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      }),
    },
    {
      id: 'last-12-months',
      label: 'Last 12 Months',
      getRange: () => ({
        start: format(startOfMonth(subMonths(currentDate, 11)), 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      }),
    },
    {
      id: 'this-quarter',
      label: 'This Quarter',
      getRange: () => ({
        start: format(startOfQuarter(currentDate), 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      }),
    },
    {
      id: 'last-quarter',
      label: 'Last Quarter',
      getRange: () => {
        const lastQuarter = subQuarters(currentDate, 1);
        return {
          start: format(startOfQuarter(lastQuarter), 'yyyy-MM-dd'),
          end: format(currentDate, 'yyyy-MM-dd'),
        };
      },
    },
    {
      id: 'last-year',
      label: 'Last Year',
      getRange: () => {
        const lastYear = subYears(currentDate, 1);
        return {
          start: format(startOfYear(lastYear), 'yyyy-MM-dd'),
          end: format(new Date(lastYear.getFullYear(), 11, 31), 'yyyy-MM-dd'),
        };
      },
    },
    {
      id: 'last-3-years',
      label: 'Last 3 Years',
      getRange: () => ({
        start: format(subYears(currentDate, 3), 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      }),
    },
    {
      id: 'custom',
      label: 'Custom Range',
      getRange: () => ({ start: startDate, end: endDate }),
    },
  ];

  // Update date range
  const updateDateRange = (newStartDate, newEndDate, presetId = 'custom') => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setSelectedPreset(presetId);
  };

  // Apply a preset
  const applyPreset = (presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      const range = preset.getRange();
      setStartDate(range.start);
      setEndDate(range.end);
      setSelectedPreset(presetId);
    }
  };

  // Reset to defaults (using latest data date)
  const resetToDefaults = () => {
    const currentDate = latestDataDate || new Date();
    setStartDate(format(startOfYear(currentDate), 'yyyy-MM-dd'));
    setEndDate(format(currentDate, 'yyyy-MM-dd'));
    setSelectedPreset('ytd');
    setSelectedClinic('all');
    setSelectedClinics([]);
  };

  // Clinic filter actions
  const toggleClinicSelection = (clinicId, maxClinics = 6) => {
    setSelectedClinics((prev) => {
      if (prev.includes(clinicId)) {
        return prev.filter((id) => id !== clinicId);
      } else {
        if (prev.length >= maxClinics) {
          return prev; // Don't add if at max
        }
        return [...prev, clinicId];
      }
    });
  };

  const clearClinicSelections = () => {
    setSelectedClinics([]);
  };

  const value = {
    // Current values
    startDate,
    endDate,
    selectedPreset,

    // Clinic filter values
    selectedClinic,
    selectedClinics,

    // Latest data date
    latestDataDate,
    isLoadingDataDate,

    // Presets
    presets,

    // Date actions
    updateDateRange,
    applyPreset,
    resetToDefaults,

    // Date setters (for custom range)
    setStartDate,
    setEndDate,

    // Clinic filter actions
    setSelectedClinic,
    setSelectedClinics,
    toggleClinicSelection,
    clearClinicSelections,
  };

  return (
    <DateFilterContext.Provider value={value}>
      {children}
    </DateFilterContext.Provider>
  );
};

// Custom hook to use the date filter context
export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};

export default DateFilterContext;
