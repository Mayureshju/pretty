import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server is down | Pretty Petals",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <h1 className="text-xl font-medium text-black">Server is down</h1>
    </div>
  );
}
