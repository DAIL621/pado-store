export function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div>
          <div className="footer-brand">파도스토리</div>
          <p>산지의 오늘을 식탁까지 정직하게 연결합니다.</p>
          <div className="footer-sns" aria-label="SNS">
            <span>Instagram</span>
            <span>Kakao Channel</span>
          </div>
        </div>
        <div>
          <strong>고객센터</strong>
          <a className="phone" href="tel:01031287775">010-3128-7775</a>
          <p>평일 10:00~18:00<br />주말 및 공휴일 휴무 (문자가능)</p>
        </div>
        <div className="company-info">
          <strong>사업자정보</strong>
          <p>대표 강대현 · 사업자등록번호 197-81-03727<br />통신판매업 제2025-부산중구-0163호<br />부산광역시 중구 중앙대로 16번길 13, 902호</p>
        </div>
      </div>
      <div className="shell copyright">© 2026 PADO STORY. ALL RIGHTS RESERVED.</div>
    </footer>
  );
}
