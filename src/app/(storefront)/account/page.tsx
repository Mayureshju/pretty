import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) return null;

  await connectDB();

  const dbUser = await UserModel.findOne({ clerkId: user.id }).lean();

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  return (
    <div className="space-y-5">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-[#1C2120] mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#888]">Name</span>
            <p className="text-[#1C2120] font-medium mt-0.5">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div>
            <span className="text-[#888]">Email</span>
            <p className="text-[#1C2120] font-medium mt-0.5">{email}</p>
          </div>
          {dbUser?.phone && (
            <div>
              <span className="text-[#888]">Phone</span>
              <p className="text-[#1C2120] font-medium mt-0.5">{dbUser.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Stats */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-[#1C2120] mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Order Summary
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#F2F3E8] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#737530]">{dbUser?.orderCount ?? 0}</p>
            <p className="text-xs text-[#888] mt-1">Total Orders</p>
          </div>
          <div className="bg-[#F2F3E8] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#737530]">
              &#8377; {(dbUser?.totalSpent ?? 0).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-[#888] mt-1">Total Spent</p>
          </div>
        </div>
      </div>

      {/* Saved Addresses */}
      {dbUser?.addresses && dbUser.addresses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-[#1C2120] mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Saved Addresses
          </h2>
          <div className="space-y-3">
            {dbUser.addresses.map((addr: { label?: string; address?: string; city?: string; state?: string; pincode?: string; isDefault?: boolean }, idx: number) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {addr.label && (
                    <span className="text-xs font-semibold text-[#737530] bg-[#F2F3E8] px-2 py-0.5 rounded">
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span className="text-xs text-[#2E7D32] font-medium">Default</span>
                  )}
                </div>
                <p className="text-sm text-[#464646]">
                  {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
