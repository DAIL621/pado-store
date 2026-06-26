"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

function UserIcon() {
  return (
    <svg className="login-profile-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.8 19.2c1.1-3.1 3.2-4.7 6.2-4.7s5.1 1.6 6.2 4.7" />
    </svg>
  );
}

export function AuthHeaderMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <span className="auth-loading">확인중</span>;
  }

  if (!user) {
    return <KakaoLoginButton />;
  }

  return (
    <div className="auth-menu">
      <span className="user-email">{user.email ?? "파도스토리 고객"}</span>
      <Link href="/mypage" className="mini-link profile-mini-link" aria-label="마이페이지">
        <UserIcon />
        <span>마이페이지</span>
      </Link>
      <form action="/auth/logout" method="post">
        <button type="submit" className="mini-link logout-button">로그아웃</button>
      </form>
    </div>
  );
}
