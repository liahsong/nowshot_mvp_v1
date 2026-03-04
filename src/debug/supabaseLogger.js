import { getSupabase } from "../lib/supabase";

const supabase = getSupabase();

export async function debugSignUrl(bucket, path) {
  console.group(`🪣 [Storage] sign-url 테스트: ${bucket}/${path}`);

  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, 60);

  if (error) {
    console.error("❌ sign-url 실패:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
    });
  } else {
    console.log("✅ sign-url 성공:", data.signedUrl);
  }
  console.groupEnd();
}

const _fetch = window.fetch;
window.fetch = async (...args) => {
  const [input, init] = args;
  const url = typeof input === "string" ? input : input.url;

  if (url.includes("supabase") || url.includes("/functions/v1/")) {
    console.group(`🌐 [Fetch] ${init?.method ?? "GET"} ${url}`);
    console.log("Headers:", init?.headers);
    if (init?.body) {
      try {
        console.log("Body:", JSON.parse(init.body));
      } catch {
        console.log("Body:", init.body);
      }
    }

    const res = await _fetch(...args);
    const clone = res.clone();

    console.log(`Status: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      const body = await clone.json().catch(() => clone.text());
      console.error("❌ 응답 에러:", body);
    }
    console.groupEnd();
    return res;
  }

  return _fetch(...args);
};

export async function debugEdgeFunction(fnName, payload = {}) {
  console.group(`⚡ [Edge Function] ${fnName}`);

  let accessToken = null;
  const { data: sessionData } = await supabase.auth.getSession();
  accessToken = sessionData?.session?.access_token || null;
  if (!accessToken) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    accessToken = refreshed?.session?.access_token || null;
  }
  if (!accessToken) {
    console.error("❌ Edge Function 호출 실패: access token 없음");
    console.groupEnd();
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = new Headers({
    authorization: `Bearer ${accessToken}`,
    apikey: anonKey,
    "content-type": "application/json",
  });
  console.log("Edge Function Headers:", Object.fromEntries(headers.entries()));

  const response = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("❌ Edge Function 실패:", {
      status: response.status,
      data,
    });
    console.groupEnd();
    return;
  }

  console.log("✅ Edge Function 성공:", data);
  console.groupEnd();
}
