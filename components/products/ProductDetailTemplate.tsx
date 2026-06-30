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

export function ProductDetailTemplate({ product, purchaseSlot }: Props) {
  const { template, sections, heroImages, featureItems, overviewItems, trustSignals, packagingImage } = buildProductDetailTemplateModel(product);
  const hasAutoContent = hasVisibleProductDetailContent(sections);
  const galleryImages = sections.heroImages;

  return (
    <section
      className="detail-master"
      aria-label={`${product.name} 상품 상세`}
      data-template-id={template.id}
      data-template-schema={template.schemaVersion}
    >
      <HeroSection product={product} heroImage={heroImages[0]?.url || product.image} purchaseSlot={purchaseSlot} />

      <TrustSignalSection signals={trustSignals} />

      {product.description && (
        <StoryIntroSection product={product} image={heroImages[1]?.url || heroImages[0]?.url || product.image} />
      )}

      {featureItems.length > 0 && (
        <FeatureSection productName={product.name} features={featureItems} />
      )}

      {overviewItems.length > 0 && <OverviewSection items={overviewItems} />}

      {sections.journey.length > 0 && <TimelineSection steps={sections.journey} productName={product.name} />}

      {sections.benefits.length > 0 && <AdvantageSection productName={product.name} benefits={sections.benefits} />}

      {galleryImages.length > 0 && <GallerySection images={galleryImages} productName={product.name} />}

      {sections.recipes.length > 0 && <CookingSection recipes={sections.recipes} productName={product.name} />}

      {sections.components.length > 0 && <PackageSection title="구성품" items={sections.components} tone="components" />}

      {sections.packaging.length > 0 && (
        <PackageSection title="포장 및 배송" items={sections.packaging} image={packagingImage} tone="shipping" />
      )}

      {sections.faq.length > 0 && <FAQSection faq={sections.faq} />}

      {(sections.videos.length > 0 || sections.certificates.length > 0 || sections.extraSections.length > 0) && (
        <ExtraSection
          videos={sections.videos}
          certificates={sections.certificates}
          extraSections={sections.extraSections}
        />
      )}

      {hasAutoContent && (
        <nav className="detail-master-nav" aria-label="상품 상세 섹션 바로가기">
          {sections.journey.length > 0 && <a href="#detail-master-timeline">산지 여정</a>}
          {galleryImages.length > 0 && <a href="#detail-master-gallery">사진</a>}
          {sections.recipes.length > 0 && <a href="#detail-master-cooking">먹는 방법</a>}
          {sections.packaging.length > 0 && <a href="#detail-master-shipping">포장/배송</a>}
          {sections.faq.length > 0 && <a href="#detail-master-faq">FAQ</a>}
        </nav>
      )}
    </section>
  );
}

function TrustSignalSection({ signals }: { signals: DetailTemplateTrustSignal[] }) {
  if (signals.length === 0) return null;

  return (
    <section className="shell detail-master-trust" aria-label="구매 전 확인 정보">
      {signals.map((signal) => (
        <article key={`${signal.label}-${signal.title}`}>
          <span>{signal.label}</span>
          <strong>{signal.title}</strong>
          <p>{signal.body}</p>
        </article>
      ))}
    </section>
  );
}

function StoryIntroSection({ product, image }: { product: Product; image: string }) {
  return (
    <section className="shell detail-master-story">
      <div>
        <span>FRESH FIRST</span>
        <h2>사진보다 먼저, 기준을 확인합니다</h2>
        <p>{product.description}</p>
      </div>
      <div>
        <Image src={image} alt={`${product.name} 상품 소개`} fill sizes="(max-width: 700px) 100vw, 42vw" />
      </div>
    </section>
  );
}

function HeroSection({ product, heroImage, purchaseSlot }: { product: Product; heroImage: string; purchaseSlot: ReactNode }) {
  return (
    <section className="shell detail-master-hero">
      <div className="detail-master-hero-media">
        <Image src={heroImage} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 50vw" />
        {product.badge && <span>{product.badge}</span>}
      </div>
      <div className="detail-master-hero-copy">
        <span className="origin">{product.origin}</span>
        <h1>{product.name}</h1>
        <p>{product.subtitle}</p>
        <div className="detail-master-price">
          <del>{formatPrice(product.normalPrice)}</del>
          <em>{product.discountRate}%</em>
          <strong>{formatPrice(product.price)}~</strong>
        </div>
        {product.highlights.length > 0 && (
          <ul className="detail-master-proof">
            {product.highlights.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {purchaseSlot}
      </div>
    </section>
  );
}

function FeatureSection({ productName, features }: { productName: string; features: string[] }) {
  return (
    <section className="shell detail-master-block" id="detail-master-features">
      <SectionTitle
        eyebrow="WHY PADO"
        title={`왜 파도스토리 ${productName}인가?`}
        description="신선함, 신뢰, 포장, 출고 기준을 구매 전에 바로 확인할 수 있게 정리했습니다."
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
        description="주문 전 가장 많이 확인하는 정보를 짧고 명확하게 모았습니다."
      />
      <div className="detail-master-overview">
        {items.map((item) => (
          <InfoCard key={`${item.label}-${item.title}`} {...item} />
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
        description="상품별 입력 데이터만으로 산지, 선별, 포장, 배송 흐름을 자동 구성합니다."
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
  return (
    <section className="shell detail-master-block" id="detail-master-gallery">
      <SectionTitle
        eyebrow="GALLERY"
        title="대표사진 Gallery"
        description="모바일에서는 가로 스와이프처럼 넘겨 보며 상품의 상태와 구성, 포장을 확인할 수 있습니다."
      />
      <div className="detail-master-gallery" aria-label={`${productName} 대표사진`}>
        {images.map((image, index) => (
          <figure key={`${image.label}-${image.url}-${index}`}>
            <div>
              <Image src={image.url} alt={`${productName} ${image.label}`} fill sizes="(max-width: 700px) 86vw, 33vw" />
            </div>
            <figcaption>
              <strong>{image.label}</strong>
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
          <a key={`${video.title}-${video.url}`} href={video.url} target="_blank">
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
  const icons = ["산", "선", "냉", "출", "품"];
  const descriptions = [
    "산지와 원물 기준을 먼저 확인합니다.",
    "상태가 좋은 상품만 골라 보냅니다.",
    "상품 특성에 맞는 온도로 준비합니다.",
    "주문 후 식탁까지의 시간을 줄입니다.",
    "받는 순간의 만족도를 기준으로 봅니다."
  ];
  return (
    <article className="detail-master-feature-card fade-up">
      <span>{icons[index] ?? "✓"}</span>
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
