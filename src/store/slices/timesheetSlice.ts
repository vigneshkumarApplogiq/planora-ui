import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  timesheetApiService,
  TimeEntry,
  TimeEntriesResponse,
  TimesheetSummary,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  TimeEntriesQueryParams
} from '../../services/timesheetApi';

export interface TimesheetState {
  entries: TimeEntry[];
  summary: TimesheetSummary | null;
  totalHours: number;
  billableHours: number;
  loading: boolean;
  error: string | null;
  selectedEntry: TimeEntry | null;
}

const initialState: TimesheetState = {
  entries: [],
  summary: null,
  totalHours: 0,
  billableHours: 0,
  loading: false,
  error: null,
  selectedEntry: null,
};

// Async thunks
export const fetchMyTimeEntries = createAsyncThunk(
  'timesheet/fetchMyTimeEntries',
  async (params: Omit<TimeEntriesQueryParams, 'user_id'>, { rejectWithValue }) => {
    try {
      const response = await timesheetApiService.getMyTimeEntries(params);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch time entries');
    }
  }
);

export const fetchTimesheetSummary = createAsyncThunk(
  'timesheet/fetchSummary',
  async (params: Omit<TimeEntriesQueryParams, 'user_id'>, { rejectWithValue }) => {
    try {
      const response = await timesheetApiService.getMyTimesheetSummary(params);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch timesheet summary');
    }
  }
);

export const createTimeEntry = createAsyncThunk(
  'timesheet/createEntry',
  async (data: CreateTimeEntryRequest, { rejectWithValue }) => {
    try {
      const response = await timesheetApiService.createTimeEntry(data);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create time entry');
    }
  }
);

export const updateTimeEntry = createAsyncThunk(
  'timesheet/updateEntry',
  async ({ id, data }: { id: string; data: UpdateTimeEntryRequest }, { rejectWithValue }) => {
    try {
      const response = await timesheetApiService.updateTimeEntry(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update time entry');
    }
  }
);

export const deleteTimeEntry = createAsyncThunk(
  'timesheet/deleteEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      await timesheetApiService.deleteTimeEntry(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete time entry');
    }
  }
);

export const logTimeForTask = createAsyncThunk(
  'timesheet/logTimeForTask',
  async (
    {
      taskId,
      hours,
      description,
      activityType
    }: {
      taskId: string;
      hours: number;
      description: string;
      activityType: CreateTimeEntryRequest['activity_type'];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await timesheetApiService.logTimeForTask(taskId, hours, description, activityType);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to log time for task');
    }
  }
);

export const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetTimesheet: (state) => {
      state.entries = [];
      state.summary = null;
      state.error = null;
    },
    setSelectedEntry: (state, action: PayloadAction<TimeEntry | null>) => {
      state.selectedEntry = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my time entries
      .addCase(fetchMyTimeEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTimeEntries.fulfilled, (state, action: PayloadAction<TimeEntriesResponse>) => {
        state.loading = false;
        state.entries = action.payload.items;
        state.totalHours = action.payload.total_hours;
        state.billableHours = action.payload.billable_hours;
        state.error = null;
      })
      .addCase(fetchMyTimeEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch summary
      .addCase(fetchTimesheetSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheetSummary.fulfilled, (state, action: PayloadAction<TimesheetSummary>) => {
        state.loading = false;
        state.summary = action.payload;
        state.error = null;
      })
      .addCase(fetchTimesheetSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create time entry
      .addCase(createTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTimeEntry.fulfilled, (state, action: PayloadAction<TimeEntry>) => {
        state.loading = false;
        state.entries.unshift(action.payload);
        state.totalHours += action.payload.hours;
        if (action.payload.billable) {
          state.billableHours += action.payload.hours;
        }
        state.error = null;
      })
      .addCase(createTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update time entry
      .addCase(updateTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTimeEntry.fulfilled, (state, action: PayloadAction<TimeEntry>) => {
        state.loading = false;
        const index = state.entries.findIndex(entry => entry.id === action.payload.id);
        if (index !== -1) {
          const oldEntry = state.entries[index];
          state.totalHours = state.totalHours - oldEntry.hours + action.payload.hours;
          if (oldEntry.billable) {
            state.billableHours -= oldEntry.hours;
          }
          if (action.payload.billable) {
            state.billableHours += action.payload.hours;
          }
          state.entries[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete time entry
      .addCase(deleteTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTimeEntry.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const entry = state.entries.find(e => e.id === action.payload);
        if (entry) {
          state.totalHours -= entry.hours;
          if (entry.billable) {
            state.billableHours -= entry.hours;
          }
        }
        state.entries = state.entries.filter(entry => entry.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Log time for task
      .addCase(logTimeForTask.fulfilled, (state, action: PayloadAction<TimeEntry>) => {
        state.entries.unshift(action.payload);
        state.totalHours += action.payload.hours;
        if (action.payload.billable) {
          state.billableHours += action.payload.hours;
        }
      });
  },
});

export const {
  clearError,
  resetTimesheet,
  setSelectedEntry
} = timesheetSlice.actions;

export default timesheetSlice.reducer;
