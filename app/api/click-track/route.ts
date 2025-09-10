import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../utils/supabase";

export const revalidate = 0; // No caching for click tracking

export async function POST(req: Request) {
  console.log('🚀 API /click-track POST endpoint HIT!');
  
  try {
    console.log('📥 Parsing request body...');
    const body = await req.json();
    const { linkId, ownerID, url, deltaCount } = body;

    // Use deltaCount if provided, otherwise default to 1
    const increment = deltaCount || 1;

    console.log('🔥 Click tracking request:', { linkId, ownerID, url, deltaCount: increment });

    // Validate input
    if (!linkId && (!ownerID || !url)) {
      console.log('❌ Validation failed: missing parameters');
      return NextResponse.json(
        { 
          error: "Either linkId OR (ownerID + url) must be provided" 
        }, 
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" }, 
        { status: 500 }
      );
    }

    // Call the atomic increment function
    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required for click tracking' }, 
        { status: 400 }
      );
    }

    // Method 1: By link ID
    console.log('🚀 Calling RPC with linkId:', linkId, 'increment:', increment);
    const rpcResult = await supabase.rpc('increment_click_count', {
      p_link_id: linkId,
      p_delta: increment
    });

    console.log('📊 RPC Result:', rpcResult);

    if (rpcResult.error) {
      console.error('❌ Supabase RPC error:', rpcResult.error);
      return NextResponse.json(
        { error: `Click tracking failed: ${rpcResult.error.message}` }, 
        { status: 500 }
      );
    }

    // Return success (RPC function returns void/undefined)
    return NextResponse.json({
      success: true,
      linkId: linkId,
      message: 'Click count incremented successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 CATCH BLOCK - API ERROR:', error);
    console.error('💥 Error type:', typeof error);
    console.error('💥 Error message:', error?.message);
    console.error('💥 Error stack:', error?.stack);
    return NextResponse.json(
      { error: error?.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for debugging
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("linkId");
  
  if (!linkId) {
    return NextResponse.json({ error: "linkId required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" }, 
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('links')
      .select('id, title, click_count')
      .eq('id', linkId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({
      linkId: data.id,
      title: data.title,
      clickCount: data.click_count
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}
