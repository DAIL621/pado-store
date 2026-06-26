"use client";

import { createClient } from "@/lib/supabase/client";

function ProfileIcon() {
  return (
    <svg className="login-profile-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.8 19.2c1.1-3.1 3.2-4.7 6.2-4.7s5.1 1.6 6.2 4.7" />
    </svg>
  );
}

export function KakaoLoginButton({ nextPath = "/mypage", label = "카카오로 계속하기" }: { nextPath?: string; label?: string }) {
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
    <button className="login-chip kakao-login-chip" onClick={login} type="button">
      <span className="kakao-mark" aria-hidden="true">K</span>
      <ProfileIcon />
      <span className="login-chip-label">{label}</span>
      <span className="login-chip-mobile-label">로그인</span>
    </button>
  );
}
