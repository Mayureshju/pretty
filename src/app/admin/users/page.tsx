"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import SearchInput from "@/components/admin/shared/SearchInput";
import Pagination from "@/components/admin/shared/Pagination";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface UserItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string;
  role: string | null;
  createdAt: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function toggleRole(user: UserItem) {
    const newRole = user.role === "admin" ? null : "admin";
    const action = newRole === "admin" ? "Grant" : "Remove";

    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      toast.success(
        `${action === "Grant" ? "Granted" : "Removed"} admin role for ${user.email}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role"
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C2120]">Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage user roles and permissions
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by name or email..."
          className="md:w-72"
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={pageSize} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            search
              ? "Try adjusting your search to find what you are looking for."
              : "Users will appear here once they sign up."
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    User
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Email
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Joined
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-full bg-gray-100"
                        />
                        <span className="font-medium text-[#1C2120]">
                          {user.firstName || ""}
                          {user.lastName ? ` ${user.lastName}` : ""}
                          {!user.firstName && !user.lastName && "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#737530]/10 text-[#737530]">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {format(new Date(user.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleRole(user)}
                        disabled={togglingId === user.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.role === "admin"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-[#737530]/10 text-[#737530] hover:bg-[#737530]/20"
                        }`}
                      >
                        {togglingId === user.id
                          ? "..."
                          : user.role === "admin"
                            ? "Remove Admin"
                            : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalItems={total}
            />
          </div>
        </div>
      )}
    </div>
  );
}
