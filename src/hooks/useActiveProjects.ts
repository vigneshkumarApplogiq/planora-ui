import { useState, useEffect } from 'react';
import { projectApiService } from '../services/projectApi';
import { Project } from './../services/projectApi';

export function useActiveProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeProjects = await projectApiService.getActiveProjectsList();
      setProjects(activeProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchActiveProjects,
  };
}