import Image from "next/image";
import type { ProductDetail } from "@/lib/products/detail";

type Props = {
  productName: string;
  detail?: ProductDetail;
};

export function ProductDetailTemplate({ productName, detail }: Props) {
  const heroImages = detail?.heroImages ?? [];
  const benefits = detail?.benefits ?? [];
  const journey = detail?.journey ?? [];
  const packaging = detail?.packaging ?? [];
  const recipes = detail?.recipes ?? [];
  const components = detail?.components ?? [];
  const faq = detail?.faq ?? [];
  const videos = detail?.videos ?? [];
  const certificates = detail?.certificates ?? [];
  const extraSections = detail?.extraSections ?? [];
  const hasContent = Boolean(
    heroImages.length ||
      benefits.length ||
      journey.length ||
      packaging.length ||
      recipes.length ||
      components.length ||
      faq.length ||
      videos.length ||
      certificates.length ||
      extraSections.length
  );

  if (!hasContent) return null;

  return (
    <section className="section detail-auto-section">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PADO DETAIL</span>
            <h2>관리자가 입력한 상세 정보</h2>
          </div>
          <p>상품별 입력 데이터로 자동 구성되는 상세페이지 영역입니다.</p>
        </div>

        {heroImages.length > 0 && (
          <div className="detail-auto-gallery">
            {heroImages.map((image) => (
              <figure key={`${image.label}-${image.url}`}>
                <div>
                  <Image src={image.url} alt={`${productName} ${image.label}`} fill sizes="(max-width: 700px) 100vw, 33vw" />
                </div>
                <figcaption>
                  <strong>{image.label}</strong>
                  {image.description && <span>{image.description}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {benefits.length > 0 && (
          <div className="detail-auto-block">
            <h3>왜 파도스토리 {productName}인가?</h3>
            <ul className="detail-auto-benefits">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}

        {journey.length > 0 && (
          <div className="detail-auto-block">
            <h3>산지에서 식탁까지</h3>
            <div className="detail-auto-journey">
              {journey.map((step, index) => (
                <article key={`${step.key}-${index}`}>
                  {step.image && (
                    <div>
                      <Image src={step.image} alt={`${productName} ${step.title}`} fill sizes="(max-width: 700px) 100vw, 20vw" />
                    </div>
                  )}
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h4>{step.title}</h4>
                  {step.description && <p>{step.description}</p>}
                </article>
              ))}
            </div>
          </div>
        )}

        {packaging.length > 0 && (
          <div className="detail-auto-block">
            <h3>신선함을 지키는 포장</h3>
            <ul className="detail-auto-list">
              {packaging.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {recipes.length > 0 && (
          <div className="detail-auto-block">
            <h3>맛있게 먹는 방법</h3>
            <div className="detail-auto-recipes">
              {recipes.map((recipe, index) => (
                <article key={`${recipe.title}-${index}`}>
                  {recipe.image && (
                    <div>
                      <Image src={recipe.image} alt={recipe.title} fill sizes="(max-width: 700px) 100vw, 33vw" />
                    </div>
                  )}
                  <h4>{recipe.title}</h4>
                  <p>{recipe.description}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {components.length > 0 && (
          <div className="detail-auto-block">
            <h3>구성품</h3>
            <ul className="detail-auto-list">
              {components.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {faq.length > 0 && (
          <div className="detail-auto-block">
            <h3>FAQ</h3>
            <div className="detail-auto-faq">
              {faq.map((item, index) => (
                <details key={`${item.question}-${index}`}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div className="detail-auto-block">
            <h3>상품 영상</h3>
            <ul className="detail-auto-list">
              {videos.map((video) => (
                <li key={`${video.title}-${video.url}`}>
                  {video.title}
                  {video.url && <a href={video.url} target="_blank"> 영상 보기</a>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {certificates.length > 0 && (
          <div className="detail-auto-block">
            <h3>인증서 / 증빙자료</h3>
            <div className="detail-auto-gallery">
              {certificates.map((certificate) => (
                <figure key={`${certificate.title}-${certificate.image}`}>
                  {certificate.image && (
                    <div>
                      <Image src={certificate.image} alt={certificate.title} fill sizes="(max-width: 700px) 100vw, 33vw" />
                    </div>
                  )}
                  <figcaption>
                    <strong>{certificate.title}</strong>
                    {certificate.description && <span>{certificate.description}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {extraSections.length > 0 && (
          <div className="detail-auto-block">
            <h3>추가 상세 정보</h3>
            <ul className="detail-auto-list">
              {extraSections.map((section, index) => (
                <li key={`${section.type}-${section.title}-${index}`}>{section.title || section.type}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
