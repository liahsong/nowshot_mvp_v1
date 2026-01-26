// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedBuckets = new Set(["barista_profile", "cafe_photos"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase env" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const authedClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await authedClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const bucket = String(body?.bucket ?? "").trim();
    const path = String(body?.path ?? "").trim().replace(/^\/+/, "");
    const expiresIn = Number(body?.expiresIn ?? 3600);

    if (!bucket || !path) {
      return new Response(JSON.stringify({ error: "Missing bucket/path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allowedBuckets.has(bucket)) {
      return new Response(JSON.stringify({ error: "Bucket not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      return new Response(JSON.stringify({ error: error?.message ?? "Sign failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
