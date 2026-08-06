import { DocDetail } from "@/components/workspace/docs/surface";

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DocDetail kind="doc" slug={slug} />;
}
