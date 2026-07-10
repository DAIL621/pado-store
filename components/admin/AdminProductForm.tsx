"use client";

import { useRouter } from "next/navigation";
import { AdminLayout, type AdminUser } from "@/components/admin/AdminLayout";
import {
  AdminProductBuilder,
  defaultProductOptions,
  emptyProductForm,
  type AdminProductBuilderPayload
} from "@/components/admin/AdminProductBuilder";

export function AdminProductForm({ admin }: { admin: AdminUser }) {
  const router = useRouter();

  const createProduct = async ({ form, options, detailJson, publishMode, reservedAt }: AdminProductBuilderPayload) => {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        options,
        detailJson,
        isActive: publishMode === "public",
        publishMode,
        reservedAt
      })
    });
    const result = await response.json().catch(() => ({ message: "상품 등록 API 응답을 읽지 못했습니다." }));

    return {
      ok: response.ok,
      message: response.ok ? result.message ?? "상품 등록완료. 상품 목록 페이지로 이동합니다." : result.message,
      code: result.code,
      slug: result.slug,
      productId: result.productId,
      productSlug: result.productSlug,
      productUrl: result.productUrl
    };
  };

  return (
    <AdminLayout admin={admin} active="products" title="상품 등록" subtitle="AI 초안 기반 5분 상품등록">
      <AdminProductBuilder
        title="새 상품 등록"
        initialMessage="기본정보와 사진을 넣으면 AI 초안 기반 상세페이지까지 한 흐름으로 등록할 수 있습니다."
        submitLabel="상품 등록하기"
        savingLabel="저장 중..."
        successMessage="상품 등록완료. 상품 목록 페이지에서 확인할 수 있습니다."
        initialForm={emptyProductForm}
        initialOptions={defaultProductOptions}
        draftStorageKey="pado-admin-product-create-draft"
        onSubmit={createProduct}
        onSuccess={(result) => {
          if (result.productUrl) {
            window.open(result.productUrl, "_blank", "noopener,noreferrer");
          }
          if (result.productId || result.productSlug) {
            window.sessionStorage.setItem(
              "pado-admin-last-created-product",
              JSON.stringify({
                id: result.productId,
                slug: result.productSlug,
                productUrl: result.productUrl,
                savedAt: new Date().toISOString()
              })
            );
          }
          window.setTimeout(() => {
            router.push("/admin/products");
            window.setTimeout(() => {
              if (window.location.pathname !== "/admin/products") {
                window.location.assign("/admin/products");
              }
            }, 900);
          }, 1400);
        }}
      />
    </AdminLayout>
  );
}
