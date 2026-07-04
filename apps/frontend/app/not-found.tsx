import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-6">
      <div className="max-w-md rounded-[32px] border border-[#ead8c8] bg-white p-10 text-center shadow-[0_24px_80px_rgba(35,26,19,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8f4a00]">Karali Restaurant</p>
        <h1 className="mt-4 text-4xl font-bold text-[#231a13]">Page not found</h1>
        <p className="mt-3 text-sm text-[#554336]">The page you are looking for does not exist or has moved.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-[#8f4a00] px-5 py-3 text-sm font-semibold text-white">
          Return home
        </Link>
      </div>
    </main>
  );
}
