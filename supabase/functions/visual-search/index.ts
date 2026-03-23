import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SERPAPI_KEY) {
      return new Response(
        JSON.stringify({ error: 'SERPAPI_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload base64 image to Supabase Storage to get a public URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `search-${Date.now()}.png`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: uploadError } = await supabase.storage
      .from('search-images')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload image', details: String(uploadError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('search-images')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log('Image uploaded, public URL:', publicUrl);

    // Call SerpAPI Google Lens with the public URL
    const params = new URLSearchParams({
      engine: 'google_lens',
      url: publicUrl,
      api_key: SERPAPI_KEY,
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'SerpAPI request failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Parse visual matches into our product format
    const USD_TO_PHP = 56.5; // approximate exchange rate
    const results = (data.visual_matches || []).slice(0, 24).map((item: any) => {
      let priceUSD = '';
      let pricePHP = '';

      if (item.price?.extracted_value) {
        const val = Number(item.price.extracted_value);
        priceUSD = `$${val.toFixed(2)}`;
        pricePHP = `₱${(val * USD_TO_PHP).toFixed(2)}`;
      } else if (item.price?.value) {
        priceUSD = item.price.value;
        // Try to parse dollar amount for conversion
        const match = item.price.value.match(/[\d,.]+/);
        if (match) {
          const val = parseFloat(match[0].replace(/,/g, ''));
          if (!isNaN(val)) pricePHP = `₱${(val * USD_TO_PHP).toFixed(2)}`;
        }
      }

      return {
        title: item.title || 'Untitled Product',
        priceUSD: priceUSD || 'Price N/A',
        pricePHP: pricePHP || 'Price N/A',
        price: priceUSD || 'Price N/A',
        source: item.source || 'Unknown',
        thumbnail: item.thumbnail || '',
        link: item.link || '#',
      };
    });

    // Clean up uploaded image (fire and forget)
    supabase.storage.from('search-images').remove([fileName]).catch(() => { });

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: 'Search failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
