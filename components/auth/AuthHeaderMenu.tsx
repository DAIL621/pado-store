"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

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
    return <span className="auth-loading">로그인 확인중</span>;
  }

  if (!user) {
    return <KakaoLoginButton />;
  }

  return (
    <div className="auth-menu">
      <span className="user-email">{user.email ?? "로그인 사용자"}</span>
      <Link href="/mypage" className="mini-link">마이페이지</Link>
      <form action="/auth/logout" method="post">
        <button type="submit" className="mini-link logout-button">로그아웃</button>
      </form>
    </div>
  );
}
