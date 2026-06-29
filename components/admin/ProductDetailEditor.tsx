"use client";

import {
  DEFAULT_PACKAGING,
  type ProductDetail,
  type ProductDetailFaq,
  type ProductDetailRecipe
} from "@/lib/products/detail";

type Props = {
  value: ProductDetail;
  onChange: (value: ProductDetail) => void;
};

export function ProductDetailEditor({ value, onChange }: Props) {
  const update = <K extends keyof ProductDetail>(key: K, nextValue: ProductDetail[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const updateHero = (index: number, key: "url" | "description", nextValue: string) => {
    update(
      "heroImages",
      value.heroImages.map((image, imageIndex) => (imageIndex === index ? { ...image, [key]: nextValue } : image))
    );
  };

  const updateBenefit = (index: number, nextValue: string) => {
    update(
      "benefits",
      value.benefits.map((benefit, benefitIndex) => (benefitIndex === index ? nextValue : benefit))
    );
  };

  const updateJourney = (index: number, key: "title" | "image" | "description", nextValue: string) => {
    update(
      "journey",
      value.journey.map((step, stepIndex) => (stepIndex === index ? { ...step, [key]: nextValue } : step))
    );
  };

  const updateTextList = (key: "packaging" | "components", index: number, nextValue: string) => {
    update(
      key,
      value[key].map((item, itemIndex) => (itemIndex === index ? nextValue : item))
    );
  };

  const addTextListItem = (key: "packaging" | "components", fallback = "") => {
    update(key, [...value[key], fallback]);
  };

  const removeTextListItem = (key: "packaging" | "components", index: number) => {
    update(key, value[key].length <= 1 ? [""] : value[key].filter((_, itemIndex) => itemIndex !== index));
  };

  const updateRecipe = (index: number, key: keyof ProductDetailRecipe, nextValue: string) => {
    update(
      "recipes",
      value.recipes.map((recipe, recipeIndex) => (recipeIndex === index ? { ...recipe, [key]: nextValue } : recipe))
    );
  };

  const addRecipe = () => update("recipes", [...value.recipes, { title: "", description: "", image: "" }]);
  const removeRecipe = (index: number) =>
    update("recipes", value.recipes.length <= 1 ? [{ title: "", description: "", image: "" }] : value.recipes.filter((_, recipeIndex) => recipeIndex !== index));

  const updateFaq = (index: number, key: keyof ProductDetailFaq, nextValue: string) => {
    update(
      "faq",
      value.faq.map((faq, faqIndex) => (faqIndex === index ? { ...faq, [key]: nextValue } : faq))
    );
  };

  const addFaq = () => update("faq", [...value.faq, { question: "", answer: "" }]);
  const removeFaq = (index: number) =>
    update("faq", value.faq.length <= 1 ? [{ question: "", answer: "" }] : value.faq.filter((_, faqIndex) => faqIndex !== index));

  return (
    <div className="wide admin-detail-editor">
      <div className="admin-detail-editor-head">
        <div>
          <strong>상세페이지 자동 생성 정보</strong>
          <small>입력한 정보는 products.detail_json에 저장되고 상품 상세페이지에 자동 표시됩니다.</small>
        </div>
      </div>

      <details open>
        <summary>상세페이지 대표사진 6장</summary>
        <div className="admin-detail-grid">
          {value.heroImages.map((image, index) => (
            <div className="admin-detail-card" key={image.label}>
              <b>{index + 1}. {image.label}</b>
              <label>
                사진 경로
                <input value={image.url} onChange={(event) => updateHero(index, "url", event.target.value)} placeholder="/images/products/sample.webp" />
              </label>
              <label>
                사진 설명
                <input value={image.description ?? ""} onChange={(event) => updateHero(index, "description", event.target.value)} placeholder="상세페이지 보조 설명" />
              </label>
            </div>
          ))}
        </div>
      </details>

      <details>
        <summary>상품 장점 5개</summary>
        <div className="admin-detail-list">
          {value.benefits.map((benefit, index) => (
            <label key={index}>
              장점 {index + 1}
              <input value={benefit} onChange={(event) => updateBenefit(index, event.target.value)} placeholder="예: 당일 선별" />
            </label>
          ))}
        </div>
      </details>

      <details>
        <summary>산지에서 식탁까지</summary>
        <div className="admin-detail-grid">
          {value.journey.map((step, index) => (
            <div className="admin-detail-card" key={step.key}>
              <b>{index + 1}. {step.title || "단계"}</b>
              <label>
                단계 제목
                <input value={step.title} onChange={(event) => updateJourney(index, "title", event.target.value)} />
              </label>
              <label>
                사진 경로
                <input value={step.image} onChange={(event) => updateJourney(index, "image", event.target.value)} placeholder="/images/story/sample.webp" />
              </label>
              <label>
                한 줄 설명
                <textarea value={step.description} onChange={(event) => updateJourney(index, "description", event.target.value)} rows={2} />
              </label>
            </div>
          ))}
        </div>
      </details>

      <details>
        <summary>포장 / 배송 정보</summary>
        <div className="admin-detail-list">
          {value.packaging.map((item, index) => (
            <div className="admin-detail-inline" key={index}>
              <label>
                안내 {index + 1}
                <input value={item} onChange={(event) => updateTextList("packaging", index, event.target.value)} />
              </label>
              <button type="button" onClick={() => removeTextListItem("packaging", index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={() => addTextListItem("packaging", DEFAULT_PACKAGING[value.packaging.length % DEFAULT_PACKAGING.length] ?? "")}>+ 안내 추가</button>
        </div>
      </details>

      <details>
        <summary>맛있게 먹는 방법</summary>
        <div className="admin-detail-grid">
          {value.recipes.map((recipe, index) => (
            <div className="admin-detail-card" key={index}>
              <b>방법 {index + 1}</b>
              <label>
                제목
                <input value={recipe.title} onChange={(event) => updateRecipe(index, "title", event.target.value)} placeholder="예: 전복버터구이" />
              </label>
              <label>
                설명
                <textarea value={recipe.description} onChange={(event) => updateRecipe(index, "description", event.target.value)} rows={2} />
              </label>
              <label>
                이미지 경로 optional
                <input value={recipe.image ?? ""} onChange={(event) => updateRecipe(index, "image", event.target.value)} placeholder="/images/recipes/sample.webp" />
              </label>
              <button type="button" onClick={() => removeRecipe(index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={addRecipe}>+ 방법 추가</button>
        </div>
      </details>

      <details>
        <summary>구성품</summary>
        <div className="admin-detail-list">
          {value.components.map((item, index) => (
            <div className="admin-detail-inline" key={index}>
              <label>
                구성품 {index + 1}
                <input value={item} onChange={(event) => updateTextList("components", index, event.target.value)} placeholder="예: 활전복 1kg" />
              </label>
              <button type="button" onClick={() => removeTextListItem("components", index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={() => addTextListItem("components")}>+ 구성품 추가</button>
        </div>
      </details>

      <details>
        <summary>FAQ</summary>
        <div className="admin-detail-list">
          {value.faq.map((item, index) => (
            <div className="admin-detail-card" key={index}>
              <b>FAQ {index + 1}</b>
              <label>
                질문
                <input value={item.question} onChange={(event) => updateFaq(index, "question", event.target.value)} placeholder="예: 언제 출고되나요?" />
              </label>
              <label>
                답변
                <textarea value={item.answer} onChange={(event) => updateFaq(index, "answer", event.target.value)} rows={2} />
              </label>
              <button type="button" onClick={() => removeFaq(index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={addFaq}>+ FAQ 추가</button>
        </div>
      </details>
    </div>
  );
}
