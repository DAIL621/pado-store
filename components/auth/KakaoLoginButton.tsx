"use client";

import { createClient } from "@/lib/supabase/client";

export function KakaoLoginButton({ nextPath = "/mypage", label = "카카오 로그인" }: { nextPath?: string; label?: string }) {
  const login = async () => {
    try {
      const supabase = createClient();
      const safeNextPath = nextPath.startsWith("/") ? nextPath : "/mypage";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`
        }
      });

      if (error) alert(error.message);
    } catch {
      alert("카카오 로그인 연결을 위해 Supabase URL과 키가 필요합니다.");
    }
  };

  return (
    <button className="login-chip" onClick={login} type="button">
      {label}
    </button>
  );
}
