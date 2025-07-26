import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Module,
  CultureCourse,
  CultureModuleResponse,
  courseToCultureModule,
  cultureModuleToCourse,
} from '@/types/culture';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export function useCultureModules() {
  const { data: session, status } = useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use refs to track if we've already fetched for this user
  const lastFetchedUserId = useRef<string | null>(null);
  const hasFetched = useRef<boolean>(false);

  // Fetch all culture modules
  const fetchModules = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/company/culture');
      const data: CultureModuleResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch culture modules');
      }

      // Convert Course objects to Module format for component compatibility
      const convertedModules = data.modules?.map(courseToCultureModule) || [];
      setModules(convertedModules);

      // Mark as fetched for this user
      lastFetchedUserId.current = session.user.id;
      hasFetched.current = true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      console.error('Fetch modules error:', err);
      toast.error(`Failed to load culture modules: ${errorMessage}`);
      // Clear error state so it doesn't block UI
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load modules only when user changes or on first load
  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load

    if (
      session?.user?.id &&
      (!hasFetched.current || lastFetchedUserId.current !== session.user.id)
    ) {
      fetchModules();
    } else if (!session?.user && hasFetched.current) {
      // Clear data if user logs out
      setModules([]);
      setLoading(false);
      hasFetched.current = false;
      lastFetchedUserId.current = null;
    }
  }, [session?.user?.id, status, fetchModules]);

  // Manual refetch function that bypasses the cache
  const refetch = useCallback(async () => {
    hasFetched.current = false; // Force refetch
    await fetchModules();
  }, [fetchModules]);

  // Create a new culture module
  const createModule = async (): Promise<Module | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/company/culture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled Module',
          content: 'Start writing your culture module content here...',
          quiz: null,
        }),
      });

      const data: CultureModuleResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || 'Failed to create culture module';
        console.error('API Error:', data);
        toast.error(`Failed to create module: ${errorMessage}`);
        return null;
      }

      if (data.module) {
        const newModule = courseToCultureModule(data.module);
        setModules((prev) => [...prev, newModule]);
        return newModule;
      }

      return null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      console.error('Create module error:', err);
      toast.error(`Failed to create module: ${errorMessage}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Update a culture module
  const updateModule = async (
    moduleId: string,
    updates: Partial<Module>
  ): Promise<Module | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      // Convert Module updates to Course format using the utility function
      const courseUpdates = cultureModuleToCourse(
        {
          id: moduleId,
          title: '',
          content: '',
          quiz: [],
          ...updates,
        } as Module,
        session?.user?.companyId || session?.user?.id || '',
        session?.user?.id || ''
      );

      // Remove fields that shouldn't be updated
      delete courseUpdates.companyId;
      delete courseUpdates.createdBy;
      delete courseUpdates.isCompanySpecific;
      delete courseUpdates.category;

      const response = await fetch(`/api/company/culture/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseUpdates),
      });

      const data: CultureModuleResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || 'Failed to update culture module';
        console.error('API Error:', data);
        toast.error(`Failed to update module: ${errorMessage}`);
        return null;
      }

      if (data.module) {
        const updatedModule = courseToCultureModule(data.module);
        setModules((prev) =>
          prev.map((m) => (m.id === moduleId ? updatedModule : m))
        );
        return updatedModule;
      }

      return null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      console.error('Update module error:', err);
      toast.error(`Failed to update module: ${errorMessage}`);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete a culture module
  const deleteModule = async (moduleId: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/company/culture/${moduleId}`, {
        method: 'DELETE',
      });

      const data: CultureModuleResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || 'Failed to delete culture module';
        console.error('API Error:', data);
        toast.error(`Failed to delete module: ${errorMessage}`);
        return false;
      }

      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      console.error('Delete module error:', err);
      toast.error(`Failed to delete module: ${errorMessage}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    modules,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createModule,
    updateModule,
    deleteModule,
    refetch,
  };
}
