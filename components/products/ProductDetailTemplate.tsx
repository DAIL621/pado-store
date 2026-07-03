import Image from "next/image";
import type { ReactNode } from "react";
import { formatPrice, type Product } from "@/data/products";
import { getVisibleProductDetailSections, hasVisibleProductDetailContent } from "@/lib/products/detail-sections";
import {
  buildProductDetailTemplateModel,
  type DetailTemplateInfoCard,
  type DetailTemplateTrustSignal
} from "@/lib/products/detail-template-engine";

type Props = {
  product: Product;
  purchaseSlot: ReactNode;
};

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

type GalleryLayout = "spotlight" | "mosaic" | "editorial" | "dense";

type JourneyStep = ReturnType<typeof getVisibleProductDetailSections>["journey"][number];
type Recipe = ReturnType<typeof getVisibleProductDetailSections>["recipes"][number];
type HeroImage = ReturnType<typeof getVisibleProductDetailSections>["heroImages"][number];
type GalleryItem = HeroImage & { badge?: string; title?: string; caption?: string; role?: string };
type FaqItem = ReturnType<typeof getVisibleProductDetailSections>["faq"][number];

export function ProductDetailTemplate({ product, purchaseSlot }: Props) {
  const { template, sections, heroImages, featureItems, overviewItems, trustSignals, packagingImage, auto } = buildProductDetailTemplateModel(product);
  const hasAutoContent = hasVisibleProductDetailContent(sections);
  const galleryImages: GalleryItem[] = auto.gallery.length ? auto.gallery : sections.heroImages.length ? sections.heroImages : heroImages;
  const mainImage = heroImages[0]?.url || product.image;

  return (
    <section
      className="detail-master detail-master-v2 detail-master-v4 detail-master-v6"
      aria-label={`${product.name} 상품 상세`}
      data-template-id={template.id}
      data-template-schema={template.schemaVersion}
      data-template-kind={template.kind}
    >
      <HeroSection product={product} heroImage={mainImage} heroImages={heroImages} purchaseSlot={purchaseSlot} />

      <BrandHeroSection product={product} image={heroImages[1]?.url || mainImage} />

      <TrustSignalSection signals={trustSignals} />

      <BrandStorySection product={product} image={heroImages[1]?.url || mainImage} promise={template.copy.promise} />

      <ProductionStorySection product={product} image={heroImages[2]?.url || mainImage} promise={template.copy.promise} />

      {product.description && (
        <StoryIntroSection product={product} image={heroImages[1]?.url || mainImage} promise={template.copy.promise} />
      )}

      {featureItems.length > 0 && <FeatureSection productName={product.name} features={featureItems} />}

      <FreshnessSection product={product} image={heroImages[3]?.url || mainImage} />

      {overviewItems.length > 0 && <OverviewSection items={overviewItems} />}

      <ProductFitSection product={product} eyebrow={template.copy.eyebrow} usage={template.copy.usage} promise={template.copy.promise} />

      {sections.journey.length > 0 && <TimelineSection steps={sections.journey} productName={product.name} />}

      <ProductImpactBanner product={product} image={heroImages[2]?.url || mainImage} promise={template.copy.promise} />

      <MidConversionCta product={product} reasons={auto.purchaseReasons} />

      {sections.benefits.length > 0 && <AdvantageSection productName={product.name} benefits={sections.benefits} />}

      {galleryImages.length > 0 && <GallerySection images={galleryImages} productName={product.name} />}

      <ComparisonSection product={product} comparison={auto.comparison} />

      {sections.recipes.length > 0 && <CookingSection recipes={sections.recipes} productName={product.name} />}

      {sections.components.length > 0 && <PackageSection title="구성품" items={sections.components} tone="components" />}

      {sections.packaging.length > 0 && (
        <PackageSection title="포장 및 배송" items={sections.packaging} image={packagingImage} tone="shipping" />
      )}

      {sections.faq.length > 0 && <FAQSection faq={sections.faq} />}

      <ReviewReadySection product={product} reviews={auto.reviews} />
      <BrandPromiseSection />

      {(sections.videos.length > 0 || sections.certificates.length > 0 || sections.extraSections.length > 0) && (
        <ExtraSection videos={sections.videos} certificates={sections.certificates} extraSections={sections.extraSections} />
      )}

      <FinalCtaSection product={product} />

      {hasAutoContent && (
        <nav className="detail-master-nav" aria-label="상품 상세 섹션 바로가기">
          {sections.journey.length > 0 && <a href="#detail-master-timeline">산지 여정</a>}
          {galleryImages.length > 0 && <a href="#detail-master-gallery">사진</a>}
          {sections.recipes.length > 0 && <a href="#detail-master-cooking">먹는 법</a>}
          {sections.packaging.length > 0 && <a href="#detail-master-shipping">포장/배송</a>}
          {sections.faq.length > 0 && <a href="#detail-master-faq">FAQ</a>}
        </nav>
      )}
    </section>
  );
}

function HeroSection({
  product,
  heroImage,
  heroImages,
  purchaseSlot
}: {
  product: Product;
  heroImage: string;
  heroImages: Array<{ label: string; url: string; description?: string }>;
  purchaseSlot: ReactNode;
}) {
  const totalStock = getTotalStock(product);
  const isSoldOut = totalStock <= 0;
  const discountVisible = product.discountRate > 0;
  const thumbnails = heroImages.slice(0, 5);

  return (
    <section className="shell detail-master-hero detail-master-hero-premium">
      <div className="detail-master-hero-gallery">
        <div className="detail-master-hero-media">
          <Image src={heroImage} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 62vw" />
          {product.badge && <span className="detail-master-hero-badge">{product.badge}</span>}
        </div>
        {thumbnails.length > 1 && (
          <div className="detail-master-thumb-rail" aria-label="대표사진 미리보기">
            {thumbnails.map((image, index) => (
              <span key={`${image.url}-${index}`} className={index === 0 ? "active" : ""}>
                <Image src={image.url} alt={image.label || `${product.name} 사진 ${index + 1}`} fill sizes="72px" />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="detail-master-hero-copy">
        <div className="detail-master-hero-kicker">
          <strong>PADO STORY</strong>
          <span>★ 4.9 · 리뷰 준비중</span>
        </div>
        <h1>{product.name}</h1>
        <p>{product.subtitle || "좋은 산지, 빠른 출고, 신선한 포장 기준으로 준비한 파도스토리 수산물입니다."}</p>

        <div className="detail-master-price-panel" aria-label="상품 가격 정보">
          {discountVisible && (
            <div className="detail-master-discount">
              <em>{product.discountRate}%</em>
              <span>할인</span>
            </div>
          )}
          <div className="detail-master-price">
            {discountVisible && <del>{formatPrice(product.normalPrice)}</del>}
            <strong>{formatPrice(product.price)}~</strong>
            <small>{isSoldOut ? "현재 품절" : `구매 가능 ${totalStock}개`}</small>
          </div>
        </div>

        <div className="detail-master-delivery-line">
          <span>평일 오후 1시 이전 주문 당일 출고</span>
          <strong>냉장 신선 배송</strong>
        </div>

        <div className="detail-master-hero-purchase" id="detail-master-hero-purchase" aria-label="옵션 선택 및 구매">
          {purchaseSlot}
        </div>
      </div>
    </section>
  );
}

function BrandHeroSection({ product, image }: { product: Product; image: string }) {
  return (
    <section className="shell detail-brand-hero" aria-label="파도스토리 브랜드 약속">
      <div className="detail-brand-hero-copy">
        <span>PADO STORY</span>
        <h2>산지의 오늘을 식탁까지.</h2>
        <p>{product.origin}에서 시작한 신선함을 선별, 포장, 출고 기준으로 식탁까지 지켜 보냅니다.</p>
      </div>
      <div className="detail-brand-hero-points" aria-label="브랜드 신뢰 요소">
        {["산지직송", "당일출고", "신선배송", "실물촬영"].map((item) => (
          <strong key={item}>{item}</strong>
        ))}
      </div>
      <div className="detail-brand-hero-image">
        <Image src={image} alt={`${product.name} 브랜드 이미지`} fill sizes="(max-width: 700px) 100vw, 34vw" />
      </div>
    </section>
  );
}

function TrustSignalSection({ signals }: { signals: DetailTemplateTrustSignal[] }) {
  const defaults: DetailTemplateTrustSignal[] = [
    { label: "산지직송", title: "산지에서 바로", body: "중간 보관 시간을 줄여 신선도를 지킵니다." },
    { label: "당일출고", title: "13시 전 출고", body: "평일 기준 빠르게 포장해 출고합니다." },
    { label: "신선포장", title: "냉장 포장", body: "상품 특성에 맞춘 포장재를 사용합니다." },
    { label: "선별", title: "상태 확인", body: "출고 전 크기와 상태를 확인합니다." },
    { label: "실물촬영", title: "사진 중심", body: "등록한 사진을 상세페이지에 그대로 반영합니다." },
    { label: "품질검수", title: "문제 대응", body: "수령 후 문제가 있으면 고객센터가 확인합니다." }
  ];
  const merged = [...signals, ...defaults].slice(0, 6);
  if (merged.length === 0) return null;

  return (
    <section className="shell detail-master-trust detail-master-reasons" aria-label="왜 파도스토리인가">
      <div className="detail-master-reasons-title">
        <span>WHY PADO STORY</span>
        <h2>왜 파도스토리인가?</h2>
      </div>
      {merged.map((signal, index) => (
        <article key={`${signal.label}-${signal.title}`} className="fade-up">
          <i aria-hidden="true">{["산", "출", "냉", "선", "실", "검"][index] ?? "✓"}</i>
          <span>{signal.label}</span>
          <strong>{signal.title}</strong>
          <p>{signal.body}</p>
        </article>
      ))}
    </section>
  );
}

function BrandStorySection({ product, image, promise }: { product: Product; image: string; promise: string }) {
  return (
    <section className="shell detail-brand-story" aria-label="파도스토리 브랜드 스토리">
      <div>
        <span>BRAND STORY</span>
        <h2>PADO STORY는 좋은 산지와 좋은 식탁 사이를 잇습니다.</h2>
        <p>
          생산자의 산지를 확인하고, 상품마다 다른 신선 포장 기준을 적용합니다.
          고객의 화면에서 본 기대감이 도착 순간까지 이어지도록 관리합니다.
        </p>
        <strong>{promise}</strong>
      </div>
      <div>
        <Image src={image} alt={`${product.name} 생산자와 산지 이야기`} fill sizes="(max-width: 700px) 100vw, 42vw" />
      </div>
    </section>
  );
}

function ProductionStorySection({ product, image, promise }: { product: Product; image: string; promise: string }) {
  return (
    <section className="shell detail-layout-section detail-layout-split image-left" data-layout-type="image-left-text-right" aria-label={`${product.name} 생산 스토리`}>
      <div className="detail-layout-image">
        <Image src={image} alt={`${product.name} 산지 생산 스토리`} fill sizes="(max-width: 700px) 100vw, 44vw" />
      </div>
      <div className="detail-layout-copy">
        <span>PRODUCTION STORY</span>
        <h2>좋은 상품은 좋은 산지 기준에서 시작합니다.</h2>
        <p>
          {product.origin}의 상품 특성에 맞춰 선별 기준을 먼저 정하고, 고객이 실제로 받을 상태를 기준으로 포장과 출고를 준비합니다.
        </p>
        <blockquote>{promise}</blockquote>
      </div>
    </section>
  );
}

function FreshnessSection({ product, image }: { product: Product; image: string }) {
  const items = [
    { label: "선별", value: "출고 전 상태 확인" },
    { label: "포장", value: "상품별 신선 포장" },
    { label: "출고", value: "평일 13시 전 당일 출고" }
  ];

  return (
    <section className="shell detail-layout-section detail-layout-split text-left" data-layout-type="text-left-image-right" aria-label={`${product.name} 신선도 기준`}>
      <div className="detail-layout-copy">
        <span>FRESHNESS</span>
        <h2>신선함은 설명보다 과정으로 증명합니다.</h2>
        <p>사진, 선별, 포장, 배송 안내가 같은 흐름으로 이어져 구매 전에 받게 될 상품 상태를 더 쉽게 예상할 수 있습니다.</p>
        <div className="detail-freshness-metrics">
          {items.map((item) => (
            <strong key={item.label}>
              <em>{item.label}</em>
              {item.value}
            </strong>
          ))}
        </div>
      </div>
      <div className="detail-layout-image">
        <Image src={image} alt={`${product.name} 신선 포장 기준`} fill sizes="(max-width: 700px) 100vw, 44vw" />
      </div>
    </section>
  );
}

function StoryIntroSection({ product, image, promise }: { product: Product; image: string; promise: string }) {
  return (
    <section className="shell detail-master-story">
      <div>
        <span>FRESH FIRST</span>
        <h2>사진보다 먼저, 산지와 상태를 확인합니다.</h2>
        <p>{product.description}</p>
        <strong>{promise}</strong>
      </div>
      <div>
        <Image src={image} alt={`${product.name} 상품 소개`} fill sizes="(max-width: 700px) 100vw, 42vw" />
      </div>
    </section>
  );
}

function FeatureSection({ productName, features }: { productName: string; features: string[] }) {
  return (
    <section className="shell detail-master-block" id="detail-master-features">
      <SectionTitle
        eyebrow="SELLING POINT"
        title={`${productName}의 구매 포인트`}
        description="고객이 구매 전에 확인하고 싶은 핵심 포인트를 짧고 명확하게 정리했습니다."
      />
      <div className="detail-master-feature-grid">
        {features.map((feature, index) => (
          <FeatureCard key={`${feature}-${index}`} index={index} title={feature} />
        ))}
      </div>
    </section>
  );
}

function OverviewSection({ items }: { items: DetailTemplateInfoCard[] }) {
  return (
    <section className="shell detail-master-block" id="detail-master-overview">
      <SectionTitle
        eyebrow="AT A GLANCE"
        title="상품 한눈에 보기"
        description="산지, 배송, 보관, 구성 정보를 한 번에 확인할 수 있게 모았습니다."
      />
      <div className="detail-master-overview">
        {items.map((item) => (
          <InfoCard key={`${item.label}-${item.title}`} {...item} />
        ))}
      </div>
    </section>
  );
}

function ProductFitSection({ product, eyebrow, usage, promise }: { product: Product; eyebrow: string; usage: string; promise: string }) {
  const items = [
    { label: "추천 용도", value: usage },
    { label: "선별 기준", value: promise },
    { label: "구매 전 확인", value: "옵션별 중량, 가격, 재고를 구매 영역에서 한 번 더 확인하세요." }
  ];

  return (
    <section className="shell detail-master-fit" aria-label={`${product.name} 구매 추천 정보`}>
      <div>
        <span>{eyebrow}</span>
        <h2>{product.name}는 이런 분께 좋습니다.</h2>
      </div>
      <div>
        {items.map((item) => (
          <article key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductImpactBanner({ product, image, promise }: { product: Product; image: string; promise: string }) {
  return (
    <section className="shell detail-master-impact detail-full-bleed-banner" aria-label={`${product.name} 감성 배너`}>
      <div>
        <span>{product.origin}</span>
        <h2>{product.origin}의 바다를 그대로 식탁까지.</h2>
        <p>{promise}</p>
      </div>
      <div>
        <Image src={image} alt={`${product.name} 신선함`} fill sizes="(max-width: 700px) 100vw, 38vw" />
      </div>
    </section>
  );
}

function MidConversionCta({ product, reasons }: { product: Product; reasons: string[] }) {
  const totalStock = getTotalStock(product);
  const isSoldOut = totalStock <= 0;
  const visibleReasons = reasons.slice(0, 3);

  return (
    <section className="shell detail-mid-cta" data-layout-type="conversion-cta" aria-label={`${product.name} 중간 구매 안내`}>
      <div>
        <span>ORDER CHECK</span>
        <h2>지금 확인할 것은 세 가지입니다.</h2>
        <p>가격, 배송, 재고를 한 번에 보고 바로 옵션을 선택할 수 있게 구매 영역으로 연결합니다.</p>
      </div>
      {visibleReasons.length > 0 && (
        <div className="detail-auto-reasons" aria-label="자동 생성 구매 이유">
          {visibleReasons.map((reason, index) => (
            <span key={`${reason}-${index}`}>{reason}</span>
          ))}
        </div>
      )}
      <ul>
        <li>
          <strong>{formatPrice(product.price)}~</strong>
          <span>판매가격</span>
        </li>
        <li>
          <strong>{isSoldOut ? "품절" : `${totalStock}개`}</strong>
          <span>구매 가능 재고</span>
        </li>
        <li>
          <strong>13시 전</strong>
          <span>평일 당일 출고</span>
        </li>
      </ul>
      <a href="#purchase-box" className={isSoldOut ? "disabled" : ""}>
        {isSoldOut ? "재입고 안내 확인" : "옵션 선택하러 가기"}
      </a>
    </section>
  );
}

function TimelineSection({ steps, productName }: { steps: JourneyStep[]; productName: string }) {
  return (
    <section className="shell detail-master-block" id="detail-master-timeline">
      <SectionTitle
        eyebrow="FROM SEA TO TABLE"
        title="산지에서 식탁까지"
        description="산지, 선별, 포장, 배송 흐름을 사진과 짧은 문장으로 보여드립니다."
      />
      <div className="detail-master-timeline">
        {steps.map((step, index) => (
          <TimelineCard key={`${step.key}-${index}`} step={step} index={index} productName={productName} />
        ))}
      </div>
    </section>
  );
}

function AdvantageSection({ productName, benefits }: { productName: string; benefits: string[] }) {
  return (
    <section className="shell detail-master-block" id="detail-master-advantages">
      <SectionTitle eyebrow="BENEFIT" title={`${productName} 핵심 장점`} />
      <div className="detail-master-advantage-grid">
        {benefits.slice(0, 5).map((benefit, index) => (
          <article className="detail-master-advantage-card fade-up" key={`${benefit}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{benefit}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function GallerySection({ images, productName }: { images: GalleryItem[]; productName: string }) {
  const layout = getGalleryLayout(images.length);

  return (
    <section className="shell detail-master-block" id="detail-master-gallery">
      <SectionTitle
        eyebrow="GALLERY"
        title="사진으로 먼저 확인하세요"
        description="사진마다 역할에 맞는 제목과 설명을 더해 실제 상품 상태를 더 빠르게 이해할 수 있게 했습니다."
      />
      <div className={`detail-master-gallery detail-master-gallery-${layout}`} data-gallery-layout={layout} data-image-count={images.length} aria-label={`${productName} 대표사진`}>
        {images.map((image, index) => (
          <figure key={`${image.label}-${image.url}-${index}`} className={index === 0 ? "is-featured" : undefined}>
            <div>
              <Image src={image.url} alt={`${productName} ${image.label}`} fill sizes={index === 0 ? "(max-width: 700px) 100vw, 48vw" : "(max-width: 700px) 50vw, 24vw"} />
              <em>{image.badge || getGalleryBadge(image.label, index)}</em>
            </div>
            <figcaption>
              <strong>{image.title || getGalleryTitle(image.label, index)}</strong>
              <span>{image.caption || image.description || getGalleryDescription(image.label, productName)}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function CookingSection({ recipes, productName }: { recipes: Recipe[]; productName: string }) {
  return (
    <section className="shell detail-master-block" id="detail-master-cooking">
      <SectionTitle eyebrow="HOW TO ENJOY" title="맛있게 먹는 방법" />
      <div className="detail-master-cooking">
        {recipes.map((recipe, index) => (
          <article key={`${recipe.title}-${index}`}>
            {recipe.image && (
              <div>
                <Image src={recipe.image} alt={`${productName} ${recipe.title}`} fill sizes="(max-width: 700px) 86vw, 33vw" />
              </div>
            )}
            <strong>{recipe.title}</strong>
            <p>{recipe.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ComparisonSection({ product, comparison }: { product: Product; comparison: { normal: string; pado: string } }) {
  const items = [
    { label: "일반 구매", body: "사진, 산지, 포장 정보가 분리되어 상품 상태를 예상하기 어렵습니다." },
    { label: "PADO STORY", body: `${product.origin} 기준의 사진, 선별, 포장, 출고 흐름을 한 페이지에서 확인합니다.` }
  ];

  return (
    <section className="shell detail-comparison" data-layout-type="comparison" aria-label={`${product.name} 구매 비교`}>
      <div className="detail-master-title">
        <span>COMPARE</span>
        <h2>구매 전에 더 분명하게 비교하세요.</h2>
        <p>고객이 불안해하는 지점을 줄이기 위해 상품 사진과 배송 기준을 같은 흐름으로 보여줍니다.</p>
      </div>
      <div>
        {items.map((item) => (
          <article key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <div className="detail-auto-comparison">
        <article>
          <strong>자동 비교 요약</strong>
          <p>{comparison.normal}</p>
        </article>
        <article>
          <strong>PADO STORY 기준</strong>
          <p>{comparison.pado}</p>
        </article>
      </div>
    </section>
  );
}

function PackageSection({ title, items, image, tone }: { title: string; items: string[]; image?: string; tone: "components" | "shipping" }) {
  return (
    <section className="shell detail-master-block" id={tone === "shipping" ? "detail-master-shipping" : "detail-master-components"}>
      <SectionTitle eyebrow={tone === "shipping" ? "PACKING" : "PACKAGE"} title={title} />
      <div className={`detail-master-package ${image ? "has-image" : ""}`}>
        {image && (
          <div className="detail-master-package-image">
            <Image src={image} alt={title} fill sizes="(max-width: 700px) 100vw, 36vw" />
          </div>
        )}
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FAQSection({ faq }: { faq: FaqItem[] }) {
  return (
    <section className="shell detail-master-block" id="detail-master-faq">
      <SectionTitle eyebrow="FAQ" title="자주 묻는 질문" />
      <div className="detail-master-faq">
        {faq.map((item, index) => (
          <details key={`${item.question}-${index}`}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ReviewReadySection({
  product,
  reviews
}: {
  product: Product;
  reviews: Array<{ score: string; title: string; body: string; metric: string }>;
}) {
  return (
    <section className="shell detail-master-review-ready detail-review-highlight" data-layout-type="review-highlight" aria-label={`${product.name} 리뷰 하이라이트`}>
      <div>
        <span>REVIEW</span>
        <h2>먼저 구매한 고객의 사진 후기가 이 영역에 모입니다.</h2>
        <p>오픈 후 실제 구매 고객의 별점, 사진 리뷰, BEST 후기를 이 위치에 표시해 구매 결정을 돕습니다.</p>
      </div>
      <div className="detail-review-cards">
        {[
          { score: "4.9", title: "신선도가 좋아요", body: "받았을 때 포장 상태와 상품 상태를 바로 확인할 수 있어 안심됩니다." },
          { score: "BEST", title: "선물용으로 좋아요", body: "구성, 가격, 배송 안내가 명확해 선물 상품 선택이 쉬웠어요." }
        ].map((item) => (
          <article key={item.title}>
            <em>{item.score}</em>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      {reviews.length > 0 && (
        <div className="detail-auto-review-cards" aria-label="자동 생성 리뷰 요약">
          {reviews.slice(0, 3).map((item) => (
            <article key={`${item.metric}-${item.title}`}>
              <em>{item.score}</em>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <span>{item.metric}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function BrandPromiseSection() {
  const items = ["산지 기준 확인", "평일 오후 1시 이전 당일 출고", "상품별 신선 포장", "문제 발생 시 고객센터 대응"];

  return (
    <section className="shell detail-master-brand-promise" aria-label="파도스토리 약속">
      <SectionTitle
        eyebrow="PADO PROMISE"
        title="파도스토리가 지키는 기본"
        description="상품이 많아져도 산지, 포장, 배송 기준은 흔들리지 않도록 관리합니다."
      />
      <div>
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function ExtraSection({
  videos,
  certificates,
  extraSections
}: {
  videos: ReturnType<typeof getVisibleProductDetailSections>["videos"];
  certificates: ReturnType<typeof getVisibleProductDetailSections>["certificates"];
  extraSections: ReturnType<typeof getVisibleProductDetailSections>["extraSections"];
}) {
  return (
    <section className="shell detail-master-block" id="detail-master-extra">
      <SectionTitle eyebrow="MORE INFO" title="추가 상세 정보" />
      <div className="detail-master-extra">
        {videos.map((video) => (
          <a key={`${video.title}-${video.url}`} href={video.url} target="_blank" rel="noreferrer">
            {video.title || "상품 영상 보기"}
          </a>
        ))}
        {certificates.map((certificate) => (
          <span key={`${certificate.title}-${certificate.image}`}>{certificate.title || "인증서"}</span>
        ))}
        {extraSections.map((section, index) => (
          <span key={`${section.type}-${section.title}-${index}`}>{section.title || section.type}</span>
        ))}
      </div>
    </section>
  );
}

function FinalCtaSection({ product }: { product: Product }) {
  const totalStock = getTotalStock(product);
  const isSoldOut = totalStock <= 0;
  const optionCopy = product.options.length ? `${product.options.length}개 옵션` : "옵션 확인";

  return (
    <section className="shell detail-master-final-cta detail-footer-order" aria-label="구매 전 마지막 확인">
      <div>
        <span>PADO STORY ORDER</span>
        <h2>{product.name}, 지금 주문 전 마지막으로 확인하세요.</h2>
        <p>
          {product.origin} 산지 기준, {optionCopy}, {isSoldOut ? "현재 품절 상태" : `현재 구매 가능 ${totalStock}개`}입니다.
          신선한 상태로 받을 수 있도록 옵션과 수량을 한 번 더 확인해주세요.
        </p>
      </div>
      <div className="detail-footer-order-price">
        <strong>{formatPrice(product.price)}~</strong>
        <a href="#purchase-box" className={isSoldOut ? "disabled" : ""}>
          {isSoldOut ? "재입고 안내 확인" : "바로 구매 영역으로"}
        </a>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="detail-master-title">
      {eyebrow && <span>{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function InfoCard({ label, title, body }: DetailTemplateInfoCard) {
  return (
    <article className="detail-master-info-card">
      <span>{label}</span>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
    </article>
  );
}

function FeatureCard({ index, title }: { index: number; title: string }) {
  const icons = ["산지", "선별", "포장", "출고", "보관"];
  const descriptions = [
    "산지와 생산 기준을 먼저 확인합니다.",
    "상태가 좋은 상품만 골라 보냅니다.",
    "상품 특성에 맞는 온도로 준비합니다.",
    "주문 후 식탁까지 시간을 줄입니다.",
    "받는 순간까지 기준을 지킵니다."
  ];

  return (
    <article className="detail-master-feature-card fade-up">
      <span>{icons[index] ?? "확인"}</span>
      <strong>{title}</strong>
      <p>{descriptions[index] ?? "상품별 핵심 기준을 확인합니다."}</p>
    </article>
  );
}

function TimelineCard({ step, index, productName }: { step: JourneyStep; index: number; productName: string }) {
  return (
    <article className="detail-master-timeline-card fade-up">
      {step.image && (
        <div>
          <Image src={step.image} alt={`${productName} ${step.title}`} fill sizes="(max-width: 700px) 86vw, 20vw" />
        </div>
      )}
      <span>{String(index + 1).padStart(2, "0")}</span>
      <strong>{step.title}</strong>
      {step.description && <p>{step.description}</p>}
    </article>
  );
}

function getTotalStock(product: Product) {
  return product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
}

function getGalleryLayout(count: number): GalleryLayout {
  if (count <= 3) return "spotlight";
  if (count <= 6) return "mosaic";
  if (count <= 12) return "editorial";
  return "dense";
}

function getGalleryTitle(label: string, index: number) {
  const text = label.toLowerCase();
  if (/대표|main/.test(text) || index === 0) return "대표사진";
  if (/크기|비교|size/.test(text)) return "크기 비교";
  if (/신선|질감|fresh/.test(text)) return "신선함과 질감";
  if (/구성|component/.test(text)) return "구성품 확인";
  if (/포장|배송|package|box/.test(text)) return "포장 상태";
  if (/조리|식탁|recipe|table/.test(text)) return "조리 후 모습";
  return label || `상세사진 ${index + 1}`;
}

function getGalleryDescription(label: string, productName: string) {
  const text = label.toLowerCase();
  if (/대표|main/.test(text)) return `${productName}의 실제 질감과 색감을 먼저 확인하세요.`;
  if (/크기|비교|size/.test(text)) return "받아보실 때의 크기감을 예상할 수 있도록 비교 컷을 제공합니다.";
  if (/신선|질감|fresh/.test(text)) return "표면 상태와 신선도를 사진으로 확인할 수 있습니다.";
  if (/구성|component/.test(text)) return "고객이 실제로 받는 구성품을 한눈에 보여드립니다.";
  if (/포장|배송|package|box/.test(text)) return "아이스팩과 냉장 포장으로 신선하게 배송합니다.";
  if (/조리|식탁|recipe|table/.test(text)) return "집에서 먹기 좋은 완성 모습을 미리 확인하세요.";
  return "상품 상태를 더 자세히 확인할 수 있는 사진입니다.";
}

function getGalleryBadge(label: string, index: number) {
  const text = label.toLowerCase();
  if (/대표|main/.test(text) || index === 0) return "MAIN";
  if (/포장|배송|package|box/.test(text)) return "PACK";
  if (/구성|component/.test(text)) return "SET";
  if (/조리|식탁|recipe|table/.test(text)) return "TABLE";
  return "PHOTO";
}
