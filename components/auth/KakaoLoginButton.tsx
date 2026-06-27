"use client";

import { useState } from "react";
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
  const [signingIn, setSigningIn] = useState(false);

  const login = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const supabase = createClient();
      const safeNextPath = nextPath.startsWith("/") ? nextPath : "/mypage";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`
        }
      });

      if (error) {
        alert(error.message);
        setSigningIn(false);
      }
    } catch {
      alert("카카오 로그인 연결을 위해 Supabase URL과 키가 필요합니다.");
      setSigningIn(false);
    }
  };

  return (
    <button className="login-chip kakao-login-chip" onClick={login} type="button" disabled={signingIn} aria-busy={signingIn}>
      <span className="kakao-mark" aria-hidden="true">K</span>
      <ProfileIcon />
      <span className="login-chip-label">{signingIn ? "연결 중..." : label}</span>
      <span className="login-chip-mobile-label">{signingIn ? "연결중" : "로그인"}</span>
    </button>
  );
}
