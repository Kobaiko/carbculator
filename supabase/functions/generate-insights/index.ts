import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Generate insights function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timeRange, startDate, endDate } = await req.json();
    console.log('Request data:', { timeRange, startDate, endDate });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')?.split(' ')[1];
    console.log('Auth header present:', !!authHeader);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Fetch user's profile for goals
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Fetch food entries
    const { data: foodEntries, error: foodError } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (foodError) {
      console.error('Error fetching food entries:', foodError);
      throw foodError;
    }

    // Fetch water entries
    const { data: waterEntries, error: waterError } = await supabase
      .from('water_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (waterError) {
      console.error('Error fetching water entries:', waterError);
      throw waterError;
    }

    // Calculate totals and averages
    const totals = (foodEntries || []).reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + Number(entry.protein),
        carbs: acc.carbs + Number(entry.carbs),
        fats: acc.fats + Number(entry.fats),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const waterTotal = (waterEntries || []).reduce((sum, entry) => sum + entry.amount, 0);
    const daysInRange = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    
    const averages = {
      calories: totals.calories / daysInRange,
      protein: totals.protein / daysInRange,
      carbs: totals.carbs / daysInRange,
      fats: totals.fats / daysInRange,
      water: waterTotal / daysInRange,
    };

    // Prepare data summary for OpenAI
    const dataSummary = {
      timeRange,
      daysInRange,
      totals,
      averages,
      goals: {
        calories: profile?.daily_calories || 2000,
        protein: profile?.daily_protein || 150,
        carbs: profile?.daily_carbs || 250,
        fats: profile?.daily_fats || 70,
        water: 2000,
      },
    };

    console.log('Sending request to OpenAI with data:', dataSummary);

    // Generate insights using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert analyzing health data. Provide three types of insights:
            1. Trends: Analyze patterns in nutrition and water intake data
            2. Recommendations: Provide actionable advice based on the data
            3. Goals: Suggest realistic goals and adjustments based on current progress
            Keep each section concise, focused, and data-driven.
            Use ** for important numbers or key points you want to emphasize.`
          },
          {
            role: 'user',
            content: `Please analyze this health data and provide insights. The data is for a ${timeRange} period:
            ${JSON.stringify(dataSummary, null, 2)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const aiData = await response.json();
    console.log('OpenAI response:', aiData);

    const insights = {
      trends: aiData.choices[0].message.content.split('\n\n')[0],
      recommendations: aiData.choices[0].message.content.split('\n\n')[1],
      goals: aiData.choices[0].message.content.split('\n\n')[2],
    };

    console.log('Generated insights:', insights);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});