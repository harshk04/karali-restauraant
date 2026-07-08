import { ScannerSuccessClient } from "./scanner-success-client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ScannerSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  return <ScannerSuccessClient searchParams={params} />;
}
