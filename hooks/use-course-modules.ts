import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  // Query key for course modules
  const modulesQueryKey = ['course-modules', session?.user?.id, isAdmin];

  // Fetch all course modules
  const {
    data: modules = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: modulesQueryKey,
    queryFn: async (): Promise<Module[]> => {
      if (!session?.user?.id) {
        throw new Error('No session available');
      }

      const url = isAdmin ? '/api/course' : '/api/company/course';
      const response = await fetch(url);
      const data: CourseModuleResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch course modules');
      }

      // Convert Course objects to Module format for component compatibility
      return data.modules?.map(courseToCourseModule) || [];
    },
    enabled: !!session?.user?.id && status !== 'loading',
    staleTime: 2 * 60 * 60 * 1000, // 2 hours - much longer cache
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for a full day
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component remounts
    refetchOnReconnect: false, // Don't refetch when network reconnects
  });

  // Create a new course module
  const createModuleMutation = useMutation({
    mutationFn: async (): Promise<Module | null> => {
      if (!session?.user?.id) {
        throw new Error('No session available');
      }

      const url = isAdmin ? '/api/course' : '/api/company/course';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled Module',
          content: 'Start writing your course module content here...',
          category: 'General',
          quiz: null,
        }),
      });

      const data: CourseModuleResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.details || data.error || 'Failed to create course module';
        console.error('API Error:', data);
        throw new Error(errorMessage);
      }

      if (data.module) {
        return courseToCourseModule(data.module);
      }

      return null;
    },
    onSuccess: (newModule) => {
      if (newModule) {
        // Optimistically update the cache
        queryClient.setQueryData(modulesQueryKey, (oldData: Module[] = []) => [
          ...oldData,
          newModule,
        ]);
        toast.success('New course module created');
      }
    },
    onError: (error: any) => {
      console.error('Create module error:', error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error';
      const humanError = getHumanReadableError(errorMessage);
      toast.error(`Failed to create module: ${humanError}`);
    },
  });

  // Update a course module
  const updateModuleMutation = useMutation({
    mutationFn: async ({
      moduleId,
      updates,
    }: {
      moduleId: string;
      updates: Partial<Module>;
    }): Promise<Module | null> => {
      if (!session?.user?.id) {
        throw new Error('No session available');
      }

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
        throw new Error(errorMessage);
      }

      if (data.module) {
        return courseToCourseModule(data.module);
      }

      return null;
    },
    onSuccess: (updatedModule, variables) => {
      if (updatedModule) {
        // Optimistically update the cache
        queryClient.setQueryData(modulesQueryKey, (oldData: Module[] = []) =>
          oldData.map((m) => (m.id === variables.moduleId ? updatedModule : m))
        );
        toast.success('Course module updated');
      }
    },
    onError: (error: any) => {
      console.error('Update module error:', error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error';
      const humanError = getHumanReadableError(errorMessage);
      toast.error(`Failed to update module: ${humanError}`);
    },
  });

  // Delete a course module
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string): Promise<boolean> => {
      if (!session?.user?.id) {
        throw new Error('No session available');
      }

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
        throw new Error(errorMessage);
      }

      return true;
    },
    onSuccess: (_, moduleId) => {
      // Optimistically update the cache
      queryClient.setQueryData(modulesQueryKey, (oldData: Module[] = []) =>
        oldData.filter((m) => m.id !== moduleId)
      );
      toast.success('Course module deleted');
    },
    onError: (error: any) => {
      console.error('Delete module error:', error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error';
      const humanError = getHumanReadableError(errorMessage);
      toast.error(`Failed to delete module: ${humanError}`);
    },
  });

  return {
    modules,
    loading,
    isLoading: loading,
    error,
    isCreating: createModuleMutation.isPending,
    isUpdating: updateModuleMutation.isPending,
    isDeleting: deleteModuleMutation.isPending,
    createModule: () => createModuleMutation.mutateAsync(),
    updateModule: (moduleId: string, updates: Partial<Module>) =>
      updateModuleMutation.mutateAsync({ moduleId, updates }),
    deleteModule: (moduleId: string) =>
      deleteModuleMutation.mutateAsync(moduleId),
    refetch,
  };
}
