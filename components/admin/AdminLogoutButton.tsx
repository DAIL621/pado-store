"use client";
import { useState } from "react";

export function AdminLogoutButton() {
  const [submitting, setSubmitting] = useState(false);
  return <form className="admin-logout-form" action="/auth/logout" method="post" onSubmit={() => setSubmitting(true)}><button type="submit" disabled={submitting}>{submitting ? "로그아웃 중…" : "관리자 로그아웃"}</button></form>;
}
