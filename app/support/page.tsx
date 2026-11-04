import type { Metadata } from "next";
import Link from "next/link";
import { SupportContactActions } from "@/components/support/SupportContactActions";

export const metadata: Metadata = {
  title: "고객센터 | 파도스토리",
  description: "파도스토리 배송기간, 취소, 신선식품 교환 및 환불 정책 안내"
};

const faqs = [
  ["언제 출고되나요?", "평일 오후 1시 이전 결제 완료 주문은 당일 출고가 원칙입니다. 통상 출고 다음 날 도착하며, 최대 배송기간은 결제 완료 후 5영업일입니다. 기상·조업·택배 상황에 따라 변동될 수 있습니다."],
  ["배송 상태는 어디서 확인하나요?", "로그인 후 주문조회에서 주문 및 배송 상태를 확인할 수 있습니다."],
  ["신선식품도 교환이나 환불이 가능한가요?", "일반적으로 수령 후 7일 이내 청약철회할 수 있으나 신선식품은 관련 법령의 예외가 적용될 수 있습니다. 하자나 오배송은 별도 법적 기준에 따라 처리합니다."],
  ["주문을 취소하고 싶어요.", "상품 출고 전에는 고객센터로 문의해 주세요. 출고 후에는 법령상 청약철회 가능 여부를 확인해 안내드립니다."]
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
          <h3>배송 안내 및 최대 제공기간</h3>
          <p>평일 오후 1시 이전 결제 완료 주문은 산지에서 당일 출고를 원칙으로 합니다. 일반적으로 출고 다음 날 도착하며, 오후 1시 이후·주말·공휴일 주문은 다음 영업일부터 순차 출고합니다.</p>
          <p><strong>최대 배송기간은 결제 완료 후 5영업일 이내입니다.</strong> 기상 악화, 조업 중단, 택배사 사정 등으로 배송이 지연될 경우 고객께 개별 안내드리며, 기한 내 배송이 어려운 경우 취소 및 환불을 안내합니다.</p>
          <h3>주문 취소 및 단순 변심</h3>
          <p>출고 전 취소는 고객센터로 문의해 주세요. 원칙적으로 상품 수령일부터 7일 이내 청약철회할 수 있습니다. 다만 신선식품은 시간 경과로 재판매가 곤란할 만큼 가치가 현저히 감소하는 등 전자상거래법상 청약철회 제한 사유에 해당하고 관련 사항이 사전 고지된 경우 제한될 수 있습니다. 단순 변심에 따른 반품 배송비는 고객 부담입니다.</p>
          <h3>상품 하자·오배송</h3>
          <p>상품이 파손되었거나 표시·광고 내용 또는 계약내용과 다르게 배송된 경우에는 상품 수령일부터 3개월 이내이면서 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내에 교환·환불을 요청할 수 있습니다. 상품 사진을 함께 보내주시면 신속한 처리에 도움이 됩니다. 해당 사유로 인정되는 반품 배송비는 판매자가 부담합니다.</p>
          <h3>환불 절차 및 처리기간</h3>
          <p>고객센터(010-3128-7775)에 접수해 주시면 주문 및 상품 상태 확인 후 절차를 안내드립니다. 적법한 청약철회에 따른 환급은 상품이 반환된 경우 상품을 반환받은 날부터, 아직 공급되지 않은 주문은 취소한 날부터 3영업일 이내에 처리합니다. 카드사의 실제 취소 반영일은 다를 수 있습니다.</p>
          <p>관련 법령에서 정한 소비자 권리가 위 안내보다 우선합니다.</p>
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
