import { Hero } from "@/components/home/Hero";
import { HomeSections } from "@/components/home/HomeSections";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

function logDevelopmentDataSource() {
  if (process.env.NODE_ENV !== "development") return;

  const projectRef = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname.split(".")[0] || "unknown";
    } catch {
      return "unknown";
    }
  })();
  const environment =
    projectRef === "xhplfyfvvxpnvoiiomjz"
      ? "TEST"
      : projectRef === "wvbdtiewkmwbdelajohy"
        ? "PRODUCTION"
        : "UNKNOWN";

  console.info(`[data-source] Supabase environment=${environment} projectRef=${projectRef}`);
}

export default async function HomePage() {
  logDevelopmentDataSource();
  const products = await getProducts();
  return <><Hero products={products} /><HomeSections products={products} /></>;
}
