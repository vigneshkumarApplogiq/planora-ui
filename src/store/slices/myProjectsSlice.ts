import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectApiService, MyProject, MyProjectsResponse } from '../../services/projectApi';

export interface MyProjectsState {
  projects: MyProject[];
  loading: boolean;
  error: string | null;
}

const initialState: MyProjectsState = {
  projects: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchMyProjects = createAsyncThunk(
  'myProjects/fetchMyProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectApiService.getMyProjects();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch my projects');
    }
  }
);

export const myProjectsSlice = createSlice({
  name: 'myProjects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetMyProjects: (state) => {
      state.projects = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my projects
      .addCase(fetchMyProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProjects.fulfilled, (state, action: PayloadAction<MyProjectsResponse>) => {
        state.loading = false;
        state.projects = action.payload;
        state.error = null;
      })
      .addCase(fetchMyProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  resetMyProjects
} = myProjectsSlice.actions;

export default myProjectsSlice.reducer;
