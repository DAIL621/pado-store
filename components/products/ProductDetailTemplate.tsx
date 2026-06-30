import Image from "next/image";
import { getVisibleProductDetailSections, hasVisibleProductDetailContent } from "@/lib/products/detail-sections";
import type { ProductDetail } from "@/lib/products/detail";

type Props = {
  productName: string;
  detail?: ProductDetail;
};

export function ProductDetailTemplate({ productName, detail }: Props) {
  const sections = getVisibleProductDetailSections(detail);
  const {
    heroImages,
    benefits,
    journey,
    packaging,
    recipes,
    components,
    faq,
    videos,
    certificates,
    extraSections
  } = sections;
  const hasContent = hasVisibleProductDetailContent(sections);

  if (!hasContent) return null;

  return (
    <section className="section detail-auto-section">
      <div className="shell">
        <div className="section-heading detail-auto-heading">
          <div>
            <span className="eyebrow">PADO DETAIL</span>
            <h2>{productName}를 더 자세히 확인하세요</h2>
          </div>
          <p>사진, 산지 정보, 포장 방식, 조리법까지 구매 전 꼭 필요한 정보를 한 번에 정리했습니다.</p>
        </div>

        <nav className="detail-auto-nav" aria-label="상품 상세 섹션 바로가기">
          {heroImages.length > 0 && <a href="#detail-gallery">사진</a>}
          {benefits.length > 0 && <a href="#detail-benefits">장점</a>}
          {journey.length > 0 && <a href="#detail-journey">산지 여정</a>}
          {packaging.length > 0 && <a href="#detail-packaging">포장/배송</a>}
          {recipes.length > 0 && <a href="#detail-recipes">먹는 방법</a>}
          {components.length > 0 && <a href="#detail-components">구성품</a>}
          {faq.length > 0 && <a href="#detail-faq">FAQ</a>}
          {videos.length > 0 && <a href="#detail-videos">영상</a>}
          {certificates.length > 0 && <a href="#detail-certificates">인증서</a>}
          {extraSections.length > 0 && <a href="#detail-extra">추가정보</a>}
        </nav>

        {heroImages.length > 0 && (
          <div className="detail-auto-gallery detail-auto-gallery-featured" id="detail-gallery">
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
          <div className="detail-auto-block" id="detail-benefits">
            <h3>왜 파도스토리 {productName}인가?</h3>
            <ul className="detail-auto-benefits">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}

        {journey.length > 0 && (
          <div className="detail-auto-block" id="detail-journey">
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
          <div className="detail-auto-block" id="detail-packaging">
            <h3>신선함을 지키는 포장</h3>
            <ul className="detail-auto-list">
              {packaging.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {recipes.length > 0 && (
          <div className="detail-auto-block" id="detail-recipes">
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
          <div className="detail-auto-block" id="detail-components">
            <h3>구성품</h3>
            <ul className="detail-auto-list">
              {components.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {faq.length > 0 && (
          <div className="detail-auto-block" id="detail-faq">
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
          <div className="detail-auto-block" id="detail-videos">
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
          <div className="detail-auto-block" id="detail-certificates">
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
          <div className="detail-auto-block" id="detail-extra">
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
