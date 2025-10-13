import { configureStore } from '@reduxjs/toolkit';
import { userSlice } from './slices/userSlice';
import { projectSlice } from './slices/projectSlice';
import { myProjectsSlice } from './slices/myProjectsSlice';
import { timesheetSlice } from './slices/timesheetSlice';

export const store = configureStore({
  reducer: {
    users: userSlice.reducer,
    projects: projectSlice.reducer,
    myProjects: myProjectsSlice.reducer,
    timesheet: timesheetSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;