import { DocDetail } from "@/components/workspace/docs/surface";

export default async function WikiEntry({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DocDetail kind="wiki" slug={slug} />;
}
