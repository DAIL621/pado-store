import type { Metadata } from "next";
import Link from "next/link";
import { SupportContactActions } from "@/components/support/SupportContactActions";

export const metadata: Metadata = {
  title: "고객센터 | 파도스토리",
  description: "파도스토리 주문, 배송, 교환 및 환불 안내"
};

const faqs = [
  ["언제 출고되나요?", "평일 오후 1시 이전 결제 완료 주문은 상품 준비 상황에 따라 당일 출고합니다."],
  ["배송 상태는 어디서 확인하나요?", "로그인 후 주문조회에서 주문 및 배송 상태를 확인할 수 있습니다."],
  ["신선식품도 교환이나 환불이 가능한가요?", "상품 하자, 오배송 등 표시 내용과 다른 경우 수령 즉시 사진과 함께 문의해 주세요."],
  ["주문을 취소하고 싶어요.", "상품 준비 전에는 고객센터로 문의해 주세요. 출고 이후에는 신선식품 특성상 취소가 제한될 수 있습니다."]
];

export default function SupportPage() {
  return (
    <main className="support-page">
      <section className="page-hero compact">
        <div className="shell">
          <span className="eyebrow">CUSTOMER CARE</span>
          <h1>고객센터</h1>
          <p>주문부터 배송, 교환과 환불까지 필요한 안내를 한곳에 모았습니다.</p>
        </div>
      </section>
      <div className="shell support-layout">
        <section className="support-quick-links">
          <Link href="/mypage"><strong>주문조회</strong><span>주문·배송 상태 확인 →</span></Link>
          <Link href="#contact"><strong>전화 상담</strong><span>번호 확인·복사 →</span></Link>
          <Link href="#inquiry"><strong>1:1 문의</strong><span>문의 방법 확인 →</span></Link>
        </section>
        <section id="faq" className="support-card">
          <span className="eyebrow">FAQ</span>
          <h2>자주 묻는 질문</h2>
          <div className="support-faq-list">
            {faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          </div>
        </section>
        <section id="delivery" className="support-card">
          <span className="eyebrow">DELIVERY & RETURN</span>
          <h2>배송·교환·환불 안내</h2>
          <p>신선식품은 상품 준비 또는 배송 시작 이후 단순 변심에 의한 취소·교환·반품이 제한될 수 있습니다. 상품 하자나 오배송은 수령 직후 상품과 포장 상태를 촬영해 고객센터로 문의해 주세요.</p>
        </section>
        <section id="contact" className="support-card support-contact">
          <div><span className="eyebrow">CONTACT</span><h2>상담이 필요하신가요?</h2><strong className="support-phone-number">010-3128-7775</strong><p>상담 가능 시간: 평일 10:00–18:00 · 문자 접수 가능</p></div>
          <div id="inquiry"><SupportContactActions /></div>
        </section>
        <section id="kakao" className="support-kakao"><strong>카카오톡 상담</strong><p>카카오 채널 연결 전까지 고객센터 전화 또는 문자 상담을 이용해 주세요.</p></section>
      </div>
    </main>
  );
}
