import { Navbar } from "@karali/ui";
import { StaffLogin } from "../../../features/staff/staff-login";

export default function StaffLoginPage() {
  return (
    <main>
      <Navbar />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-5 lg:grid-cols-12 lg:px-16 lg:py-16">
        <StaffLogin redirectTo="/staff/dashboard" />
      </div>
    </main>
  );
}
