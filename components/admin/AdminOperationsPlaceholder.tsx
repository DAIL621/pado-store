import Link from "next/link";

type OperationItem = {
  title: string;
  description: string;
  status: "ready" | "planned" | "blocked";
};

const statusLabel = {
  ready: "운영 가능",
  planned: "설계 필요",
  blocked: "외부/DB 필요"
};

export function AdminOperationsPlaceholder({
  title,
  description,
  items,
  primaryHref = "/admin"
}: {
  title: string;
  description: string;
  items: OperationItem[];
  primaryHref?: string;
}) {
  return (
    <div className="admin-ops-page">
      <section className="admin-ops-hero">
        <span>OPERATION MODULE</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div>
          <Link className="button teal" href={primaryHref}>관련 운영 화면 보기</Link>
          <Link className="button outline" href="/admin">대시보드로 이동</Link>
        </div>
      </section>

      <section className="admin-ops-grid" aria-label={`${title} 준비 항목`}>
        {items.map((item) => (
          <article className={`admin-ops-card ${item.status}`} key={item.title}>
            <span>{statusLabel[item.status]}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="admin-ops-note">
        <strong>운영 원칙</strong>
        <p>DB 구조가 없는 기능은 임의로 운영 테이블을 만들지 않고, 필요한 컬럼과 정책을 확정한 뒤 연결합니다. 현재 화면은 운영자가 필요한 범위를 한눈에 확인하고 다음 작업으로 바로 이어가기 위한 준비 페이지입니다.</p>
      </section>
    </div>
  );
}
