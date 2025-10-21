import React, { useState, useEffect, useCallback } from 'react';
import { epicApiService, EpicsResponse, Epic, CreateEpicRequest } from '../services/epicApi';

export interface EpicsState {
  data: EpicsResponse | null;
  loading: boolean;
  error: string | null;
}

export const useEpics = (projectId?: string) => {
  const [state, setState] = useState<EpicsState>({
    data: null,
    loading: true,
    error: null,
  });

  // Create a memoized version of fetchEpics to avoid infinite loops
  const fetchEpics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const data = await epicApiService.getEpics(1, 50, projectId);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch epics',
      });
    }
  }, [projectId]);

  useEffect(() => {
    fetchEpics();
  }, [fetchEpics]);

  const createEpic = async (epicData: CreateEpicRequest): Promise<Epic> => {
    try {
      const newEpic = await epicApiService.createEpic(epicData);
      // Refresh the list after creating
      await fetchEpics();
      return newEpic;
    } catch (error) {
      throw error;
    }
  };

  const updateEpic = async (id: string, epicData: Partial<CreateEpicRequest>): Promise<Epic> => {
    try {
      const updatedEpic = await epicApiService.updateEpic(id, epicData);
      // Refresh the list after updating
      await fetchEpics();
      return updatedEpic;
    } catch (error) {
      throw error;
    }
  };

  const deleteEpic = async (id: string): Promise<void> => {
    try {
      await epicApiService.deleteEpic(id);
      // Refresh the list after deleting
      await fetchEpics();
    } catch (error) {
      throw error;
    }
  };

  const retry = () => {
    fetchEpics();
  };

  return {
    ...state,
    createEpic,
    updateEpic,
    deleteEpic,
    retry,
    refetch: fetchEpics,
  };
};