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

export function ProductDetailTemplate({ product, purchaseSlot }: Props) {
  const { template, sections, heroImages, featureItems, overviewItems, trustSignals, packagingImage } = buildProductDetailTemplateModel(product);
  const hasAutoContent = hasVisibleProductDetailContent(sections);
  const galleryImages = sections.heroImages.length ? sections.heroImages : heroImages;

  return (
    <section
      className="detail-master detail-master-v2"
      aria-label={`${product.name} 상품 상세`}
      data-template-id={template.id}
      data-template-schema={template.schemaVersion}
      data-template-kind={template.kind}
    >
      <HeroSection
        product={product}
        heroImage={heroImages[0]?.url || product.image}
        heroSubImage={heroImages[1]?.url || heroImages[0]?.url || product.image}
        purchaseSlot={purchaseSlot}
      />

      <TrustSignalSection signals={trustSignals} />

      {product.description && (
        <StoryIntroSection product={product} image={heroImages[1]?.url || heroImages[0]?.url || product.image} promise={template.copy.promise} />
      )}

      {featureItems.length > 0 && <FeatureSection productName={product.name} features={featureItems} />}

      {overviewItems.length > 0 && <OverviewSection items={overviewItems} />}

      <ProductFitSection product={product} eyebrow={template.copy.eyebrow} usage={template.copy.usage} promise={template.copy.promise} />

      {sections.journey.length > 0 && <TimelineSection steps={sections.journey} productName={product.name} />}

      {sections.benefits.length > 0 && <AdvantageSection productName={product.name} benefits={sections.benefits} />}

      {galleryImages.length > 0 && <GallerySection images={galleryImages} productName={product.name} />}

      {sections.recipes.length > 0 && <CookingSection recipes={sections.recipes} productName={product.name} />}

      {sections.components.length > 0 && <PackageSection title="구성품" items={sections.components} tone="components" />}

      {sections.packaging.length > 0 && (
        <PackageSection title="포장 및 배송" items={sections.packaging} image={packagingImage} tone="shipping" />
      )}

      {sections.faq.length > 0 && <FAQSection faq={sections.faq} />}

      <ReviewReadySection />
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
  heroSubImage,
  purchaseSlot
}: {
  product: Product;
  heroImage: string;
  heroSubImage: string;
  purchaseSlot: ReactNode;
}) {
  const totalStock = getTotalStock(product);
  const isSoldOut = totalStock <= 0;
  const discountVisible = product.discountRate > 0;
  const reviewCopy = "리뷰 준비중";

  return (
    <section className="shell detail-master-hero detail-master-hero-premium">
      <div className="detail-master-hero-media">
        <Image src={heroImage} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 54vw" />
        {product.badge && <span className="detail-master-hero-badge">{product.badge}</span>}
        <div className="detail-master-hero-float">
          <strong>{product.origin}</strong>
          <span>산지 확인 후 출고</span>
        </div>
      </div>

      <div className="detail-master-hero-copy">
        <div className="detail-master-hero-kicker">
          <span>{product.category}</span>
          <strong>{reviewCopy}</strong>
        </div>
        <h1>{product.name}</h1>
        <p>{product.subtitle || "산지에서 선별한 신선한 수산물을 가장 좋은 상태로 보내드립니다."}</p>

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

        <div className="detail-master-hero-assurance" aria-label="구매 신뢰 정보">
          <span>산지 직송</span>
          <span>평일 13시 전 당일 출고</span>
          <span>전국 냉장배송</span>
          <span>검수 후 포장</span>
        </div>

        {product.highlights.length > 0 && (
          <ul className="detail-master-proof">
            {product.highlights.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        <HeroCommerceBar product={product} />

        <div className="detail-master-hero-actions">
          <a href="#purchase-box" className={isSoldOut ? "disabled" : ""}>
            {isSoldOut ? "재입고 확인" : "옵션 선택하기"}
          </a>
          <a href="#detail-master-gallery">사진 더 보기</a>
        </div>

        <div className="detail-master-hero-purchase" id="detail-master-hero-purchase">
          {purchaseSlot}
        </div>

        <div className="detail-master-hero-mini">
          <div>
            <Image src={heroSubImage} alt={`${product.name} 보조 사진`} fill sizes="96px" />
          </div>
          <p>등록된 사진과 상세 정보는 관리자 Preview와 실제 상품 상세페이지에서 동일하게 표시됩니다.</p>
        </div>
      </div>
    </section>
  );
}

function HeroCommerceBar({ product }: { product: Product }) {
  const totalStock = getTotalStock(product);
  const stockCopy = totalStock > 0 ? `구매 가능 ${totalStock}개` : "현재 품절";
  const items = [
    { label: "출고", value: "평일 13시 전 당일" },
    { label: "배송", value: "전국 냉장배송" },
    { label: "산지", value: product.origin },
    { label: "재고", value: stockCopy }
  ];

  return (
    <div className="detail-master-commerce-bar" aria-label="구매 핵심 정보">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function TrustSignalSection({ signals }: { signals: DetailTemplateTrustSignal[] }) {
  if (signals.length === 0) return null;

  return (
    <section className="shell detail-master-trust" aria-label="구매 전 확인 정보">
      {signals.slice(0, 4).map((signal) => (
        <article key={`${signal.label}-${signal.title}`}>
          <span>{signal.label}</span>
          <strong>{signal.title}</strong>
          <p>{signal.body}</p>
        </article>
      ))}
    </section>
  );
}

function StoryIntroSection({ product, image, promise }: { product: Product; image: string; promise: string }) {
  return (
    <section className="shell detail-master-story">
      <div>
        <span>FRESH FIRST</span>
        <h2>사진보다 먼저, 산지와 상태를 확인합니다</h2>
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
        eyebrow="WHY PADO"
        title={`왜 파도스토리 ${productName}인가요?`}
        description="선별, 포장, 출고 기준을 구매 전에 바로 확인할 수 있도록 핵심만 정리했습니다."
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
        description="주문 전 가장 많이 확인하는 산지, 배송, 보관, 구성 정보를 짧고 명확하게 모았습니다."
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
        <h2>{product.name}은 이런 분께 좋아요</h2>
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

function TimelineSection({ steps, productName }: { steps: ReturnType<typeof getVisibleProductDetailSections>["journey"]; productName: string }) {
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

function GallerySection({ images, productName }: { images: ReturnType<typeof getVisibleProductDetailSections>["heroImages"]; productName: string }) {
  const layout = getGalleryLayout(images.length);

  return (
    <section className="shell detail-master-block" id="detail-master-gallery">
      <SectionTitle
        eyebrow="GALLERY"
        title="사진으로 먼저 확인하세요"
        description="대표사진 수에 맞춰 자동으로 보기 좋은 레이아웃을 선택합니다. 사진이 많아져도 상세페이지는 깨지지 않습니다."
      />
      <div className={`detail-master-gallery detail-master-gallery-${layout}`} data-gallery-layout={layout} data-image-count={images.length} aria-label={`${productName} 대표사진`}>
        {images.map((image, index) => (
          <figure key={`${image.label}-${image.url}-${index}`} className={index === 0 ? "is-featured" : undefined}>
            <div>
              <Image src={image.url} alt={`${productName} ${image.label}`} fill sizes={index === 0 ? "(max-width: 700px) 100vw, 48vw" : "(max-width: 700px) 50vw, 24vw"} />
            </div>
            <figcaption>
              <strong>{image.label || `사진 ${index + 1}`}</strong>
              {image.description && <span>{image.description}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function CookingSection({ recipes, productName }: { recipes: ReturnType<typeof getVisibleProductDetailSections>["recipes"]; productName: string }) {
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

function FAQSection({ faq }: { faq: ReturnType<typeof getVisibleProductDetailSections>["faq"] }) {
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

function ReviewReadySection() {
  return (
    <section className="shell detail-master-review-ready" aria-label="리뷰 준비중">
      <div>
        <span>REVIEW</span>
        <h2>구매 후기가 준비되는 영역입니다</h2>
        <p>오픈 후 실제 구매 고객의 별점과 사진 후기를 이 위치에 표시할 예정입니다.</p>
      </div>
      <strong>사진 리뷰 · 별점 · 구매 인증</strong>
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
    <section className="shell detail-master-final-cta" aria-label="구매 전 마지막 확인">
      <div>
        <span>READY TO ORDER</span>
        <h2>{product.name}, 지금 주문 전 마지막으로 확인하세요</h2>
        <p>
          {product.origin} 산지 기준, {optionCopy}, {isSoldOut ? "현재 품절 상태" : `현재 구매 가능 ${totalStock}개`}입니다.
          옵션과 수량은 구매 영역에서 한 번 더 확인할 수 있습니다.
        </p>
      </div>
      <a href="#purchase-box" className={isSoldOut ? "disabled" : ""}>
        {isSoldOut ? "재입고 안내 확인" : "옵션 선택하러 가기"}
      </a>
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

function TimelineCard({
  step,
  index,
  productName
}: {
  step: ReturnType<typeof getVisibleProductDetailSections>["journey"][number];
  index: number;
  productName: string;
}) {
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
