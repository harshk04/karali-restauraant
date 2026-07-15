import { redirect } from "next/navigation";

export default async function ShortConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string; shareToken: string }>;
}) {
  const { bookingId, shareToken } = await params;

  redirect(
    `/booking/confirmed?bookingId=${encodeURIComponent(bookingId)}&shareToken=${encodeURIComponent(shareToken)}`,
  );
}
