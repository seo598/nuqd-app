import { AssetDetail } from "@/components/asset-detail";
import { ASSETS } from "@/lib/mock-data";

/** Pre-render one static page per known asset (required for `output: export`). */
export function generateStaticParams() {
  return ASSETS.map((a) => ({ id: a.id }));
}

export default function AssetPage({ params }: { params: { id: string } }) {
  return <AssetDetail id={params.id} />;
}
