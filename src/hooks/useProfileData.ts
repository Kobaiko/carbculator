import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";

export interface ProfileFormData {
  username: string;
  height: string;
  weight: string;
  heightUnit: string;
  weightUnit: string;
  daily_calories: string;
  daily_protein: string;
  daily_carbs: string;
  daily_fats: string;
  daily_water: string;
}

export function useProfileData() {
  const session = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      console.log('Fetching profile data for user:', session?.user?.id);
      
      if (!session?.user?.id) {
        console.error('No user found in session');
        throw new Error('No user found');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!data) {
        console.error('No profile data found');
        throw new Error('No profile data found');
      }

      console.log('Profile data fetched successfully:', data);
      return data;
    },
    enabled: !!session?.user?.id,
    retry: 3,
    retryDelay: 1000,
  });

  const updateProfile = useMutation({
    mutationFn: async (updateData: Record<string, any>) => {
      if (!session?.user?.id) {
        console.error('No user found in session during update');
        throw new Error('No user found');
      }

      console.log('Updating profile with:', updateData);

      const processedData = Object.entries(updateData).reduce((acc, [key, value]) => {
        const numericFields = ['height', 'weight', 'daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats', 'daily_water'];
        if (numericFields.includes(key)) {
          acc[key] = value === '' ? null : parseFloat(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...processedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully');
      return processedData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (oldData: any) => ({
        ...oldData,
        ...data,
      }));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile,
  };
}