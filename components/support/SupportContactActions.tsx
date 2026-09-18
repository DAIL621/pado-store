"use client";

import { useState } from "react";

const PHONE = "010-3128-7775";

export function SupportContactActions() {
  const [message, setMessage] = useState("");

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PHONE);
      setMessage("전화번호를 복사했습니다.");
    } catch {
      setMessage(`전화번호: ${PHONE}`);
    }
  };

  return (
    <div className="support-safe-actions">
      <button type="button" className="button teal" onClick={copyPhone}>전화번호 복사</button>
      <button type="button" className="button outline" onClick={() => setMessage("1:1 문의는 현재 고객센터 전화 또는 문자로 접수해 주세요.")}>1:1 문의 안내</button>
      <p className="support-action-message" role="status" aria-live="polite">{message || "클릭해도 외부 앱이 자동으로 열리지 않습니다."}</p>
    </div>
  );
}
