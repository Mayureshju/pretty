import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[#1C2120] mb-6">My Account</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-[220px] shrink-0">
          <nav className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
            {[
              { label: "Dashboard", href: "/account" },
              { label: "My Orders", href: "/account/orders" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2.5 text-sm text-[#464646] rounded-lg hover:bg-[#F2F3E8] hover:text-[#737530] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
