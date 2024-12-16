import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get or create profile
    const { data: profile } = await supabase
      .from('profiles')
      .upsert([{
        id: user.id,
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fats: 70,
        daily_water: 2000,
        height_unit: 'cm',
        weight_unit: 'kg',
        updated_at: new Date().toISOString(),
      }], {
        onConflict: 'id'
      })
      .select()
      .single();

    const dataSummary = {
      goals: {
        calories: profile?.daily_calories || 2000,
        protein: profile?.daily_protein || 150,
        carbs: profile?.daily_carbs || 250,
        fats: profile?.daily_fats || 70,
        water: profile?.daily_water || 2000,
      },
    };

    // Generate insights using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert providing general insights and recommendations. 
            Focus on overall patterns and best practices rather than specific time periods.
            Provide three types of insights:
            1. Trends: Analyze general nutrition patterns
            2. Recommendations: Provide actionable advice for maintaining a healthy diet
            3. Goals: Suggest realistic goals based on the user's targets
            Keep each section concise and focused.
            Use ** for important numbers or key points you want to emphasize.
            Do not include section headers in your response.`
          },
          {
            role: 'user',
            content: `Please provide general nutrition insights and recommendations based on this user's goals:
            ${JSON.stringify(dataSummary, null, 2)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const aiData = await response.json();
    
    if (!aiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const insights = {
      trends: aiData.choices[0].message.content.split('\n\n')[0],
      recommendations: aiData.choices[0].message.content.split('\n\n')[1],
      goals: aiData.choices[0].message.content.split('\n\n')[2],
    };

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
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});