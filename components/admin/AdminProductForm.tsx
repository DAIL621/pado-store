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

  const createProduct = async ({ form, options, detailJson }: AdminProductBuilderPayload) => {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, options, detailJson })
    });
    const result = await response.json().catch(() => ({ message: "상품 등록 API 응답을 읽지 못했습니다." }));

    return {
      ok: response.ok,
      message: response.ok ? "상품이 등록되었습니다. 상품 목록 페이지에서 확인할 수 있습니다." : result.message,
      productUrl: result.productUrl
    };
  };

  return (
    <AdminLayout admin={admin} active="products" title="상품 등록" subtitle="관리자 상품 자동 생성">
      <AdminProductBuilder
        title="새 상품 등록"
        initialMessage="관리자 권한이 확인되었습니다. 상품을 등록할 수 있습니다."
        submitLabel="상품 등록하기"
        savingLabel="저장 중..."
        successMessage="상품이 등록되었습니다. 상품 목록 페이지에서 확인할 수 있습니다."
        initialForm={emptyProductForm}
        initialOptions={defaultProductOptions}
        resetAfterSuccess
        draftStorageKey="pado-admin-product-create-draft"
        onSubmit={createProduct}
        onSuccess={() => {
          window.setTimeout(() => router.push("/admin/products"), 650);
        }}
      />
    </AdminLayout>
  );
}
