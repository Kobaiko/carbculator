import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BasicInfoStep } from "./onboarding/BasicInfoStep";
import { NutritionGoalsStep } from "./onboarding/NutritionGoalsStep";
import { FirstMealStep } from "./onboarding/FirstMealStep";

type OnboardingStep = "basic-info" | "nutrition-goals" | "first-meal";

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("basic-info");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is authenticated and profile exists
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Check if profile exists
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        // If no profile exists, create one
        if (!profile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: user.id }]);

          if (insertError) throw insertError;
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was an error loading your profile. Please try again.",
        });
      }
    };

    checkProfile();
  }, [navigate, toast]);

  const handleBasicInfoSubmit = async (data: {
    username: string;
    height: string;
    weight: string;
    heightUnit: string;
    weightUnit: string;
  }) => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          height: parseFloat(data.height),
          weight: parseFloat(data.weight),
          height_unit: data.heightUnit,
          weight_unit: data.weightUnit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setCurrentStep("nutrition-goals");
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error saving your information.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNutritionGoalsSubmit = async (data: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFats: number;
  }) => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          daily_calories: data.dailyCalories,
          daily_protein: data.dailyProtein,
          daily_carbs: data.dailyCarbs,
          daily_fats: data.dailyFats,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setCurrentStep("first-meal");
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error saving your goals.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    toast({
      title: "Welcome to Carbculator!",
      description: "Your profile has been set up successfully.",
    });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 py-8">
        {currentStep === "basic-info" && (
          <BasicInfoStep onNext={handleBasicInfoSubmit} isLoading={isLoading} />
        )}
        {currentStep === "nutrition-goals" && (
          <NutritionGoalsStep
            onBack={() => setCurrentStep("basic-info")}
            onNext={handleNutritionGoalsSubmit}
            isLoading={isLoading}
          />
        )}
        {currentStep === "first-meal" && (
          <FirstMealStep
            onBack={() => setCurrentStep("nutrition-goals")}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
};