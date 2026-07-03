import { Navbar } from "@karali/ui";
import { AdminLogin } from "../../features/admin/admin-login";

export default function LoginPage() {
  return (
    <main>
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-12 lg:px-16 lg:py-16">
        <AdminLogin redirectTo="/admin/dashboard" />
      </div>
    </main>
  );
}
