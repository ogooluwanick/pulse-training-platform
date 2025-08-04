import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Module,
  CourseModule,
  CourseModuleResponse,
  courseToCourseModule,
  courseModuleToCourse,
} from '@/types/course';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getHumanReadableError, debugLog } from '@/lib/error-utils';

export function useCourseModules({ isAdmin = false } = {}) {
  const { data: session, status } = useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
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

      const url = isAdmin ? '/api/course' : '/api/company/course';
      const response = await fetch(url);
      const data: CourseModuleResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch course modules');
      }

      // Convert Course objects to Module format for component compatibility
      const convertedModules = data.modules?.map(courseToCourseModule) || [];
      setModules(convertedModules);

      // Mark as fetched for this user
      lastFetchedUserId.current = session.user.id;
      hasFetched.current = true;
    } catch (error: any) {
      console.error('Error fetching course modules:', error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error';
      const humanError = getHumanReadableError(errorMessage);
      toast.error(`Failed to load course modules: ${humanError}`);
      // Clear error state so it doesn't block UI
      setError(null);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [session?.user?.id, isAdmin]);

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

  // Create a new course module
  const createModule = async (): Promise<Module | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const url = isAdmin ? '/api/course' : '/api/company/course';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled Module',
          content: 'Start writing your course module content here...',
          quiz: null,
        }),
      });

      const data: CourseModuleResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || 'Failed to create course module';
        console.error('API Error:', data);
        const humanError = getHumanReadableError(errorMessage);
        toast.error(`Failed to create module: ${humanError}`);
        return null;
      }

      if (data.module) {
        const newModule = courseToCourseModule(data.module);
        setModules((prev) => [...prev, newModule]);
        return newModule;
      }

      return null;
    } catch (error: any) {
      console.error('Create module error:', error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error';
      const humanError = getHumanReadableError(errorMessage);
      toast.error(`Failed to create module: ${humanError}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Update a course module
  const updateModule = async (
    moduleId: string,
    updates: Partial<Module>
  ): Promise<Module | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      // Convert Module updates to Course format using the utility function
      debugLog('=== MODULE TO COURSE TRANSFORMATION ===');
      debugLog('Input Module updates:', updates);

      const fullModule = {
        id: moduleId,
        title: '',
        content: '',
        quiz: [],
        ...updates,
      } as Module;

      debugLog('Full Module before transformation:', fullModule);

      const courseUpdates = courseModuleToCourse(
        fullModule,
        isAdmin
          ? undefined
          : session?.user?.companyId || session?.user?.id || '',
        session?.user?.id || ''
      );

      debugLog('Course updates after transformation:', courseUpdates);

      // Remove fields that shouldn't be updated
      delete courseUpdates.createdBy;
      delete courseUpdates.isCompanySpecific;

      const url = isAdmin
        ? `/api/course/${moduleId}`
        : `/api/company/course/${moduleId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseUpdates),
      });

      const data: CourseModuleResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || 'Failed to update course module';
        console.error('API Error:', data);
        const humanError = getHumanReadableError(errorMessage);
        toast.error(`Failed to update module: ${humanError}`);
        return null;
      }

      if (data.module) {
        const updatedModule = courseToCourseModule(data.module);
        setModules((prev) =>
          prev.map((m) => (m.id === moduleId ? updatedModule : m))
        );
        return updatedModule;
      }

      return null;
    } catch (error: any) {
      console.error('Update module error:', error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error';
      const humanError = getHumanReadableError(errorMessage);
      toast.error(`Failed to update module: ${humanError}`);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete a course module
  const deleteModule = async (moduleId: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const url = isAdmin
        ? `/api/course/${moduleId}`
        : `/api/company/course/${moduleId}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data: CourseModuleResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || 'Failed to delete course module';
        console.error('API Error:', data);
        const humanError = getHumanReadableError(errorMessage);
        toast.error(`Failed to delete module: ${humanError}`);
        return false;
      }

      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      return true;
    } catch (error: any) {
      console.error('Delete module error:', error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error';
      const humanError = getHumanReadableError(errorMessage);
      toast.error(`Failed to delete module: ${humanError}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    modules,
    loading,
    isLoading,
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
