"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/auth/next-path";

/**
 * Email/password sign-in only. Does not create accounts or elevate permissions.
 * Review accounts must be created separately in Supabase Authentication,
 * with profiles.role='user' and no admin privileges.
 */
export function ReviewEmailLoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error || !data.user) {
        setMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      window.location.assign(sanitizeNextPath(nextPath, "/products/hairtail"));
    } catch {
      setMessage("로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      aria-label="토스페이먼츠 심사용 이메일 로그인"
      style={{ marginTop: 8, marginBottom: 12, textAlign: "left" }}
    >
      <label htmlFor="review-login-email" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
        심사용 ID (이메일)
      </label>
      <input
        id="review-login-email"
        type="email"
        autoComplete="username"
        required
        maxLength={254}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="심사용 이메일 계정"
      />
      <label htmlFor="review-login-password" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
        심사용 비밀번호
      </label>
      <input
        id="review-login-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="비밀번호"
      />
      {message && <p role="alert" style={{ color: "#bb412a", fontSize: 12, margin: "0 0 10px" }}>{message}</p>}
      <button className="button teal full" type="submit" disabled={busy}>
        {busy ? "로그인 확인 중..." : "이메일로 로그인"}
      </button>
    </form>
  );
}
