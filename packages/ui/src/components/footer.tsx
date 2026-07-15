"use client";

export function Footer() {
  return (
    <footer className="border-t border-[#dcc2b1] bg-[#fff8f5]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-8 px-4 py-8 sm:px-5 md:flex-row lg:px-16">
        <div className="text-center md:text-left">
          <div className="text-3xl font-bold text-[#8f4a00]">Karali</div>
          <div className="mt-2 text-sm text-[#554336]">
            © 2024 Karali Luxury Dining. All Rights Reserved.
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[#554336] underline">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Sustainability</a>
          <a href="#">Accessibility</a>
        </div>
        <div className="flex gap-3">
          <a className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2dfd4] text-[#8f4a00]" href="#">
            ⬤
          </a>
          <a className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2dfd4] text-[#8f4a00]" href="#">
            ✉
          </a>
        </div>
      </div>
    </footer>
  );
}
