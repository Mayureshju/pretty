"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import SearchInput from "@/components/admin/shared/SearchInput";
import Pagination from "@/components/admin/shared/Pagination";
import EmptyState from "@/components/admin/shared/EmptyState";
import LoadingSkeleton from "@/components/admin/shared/LoadingSkeleton";
import toast from "react-hot-toast";

interface CustomerItem {
  _id: string;
  name: { first: string; last?: string };
  email: string;
  phone?: string;
  addresses: { city?: string }[];
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setCustomers(data.customers);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C2120]">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage your customers
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
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={
            search
              ? "Try adjusting your search to find what you are looking for."
              : "Customers will appear here once they create accounts."
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    City
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Orders
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Total Spent
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Last Order
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#1C2120]">
                      {customer.name.first}
                      {customer.name.last ? ` ${customer.name.last}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {customer.email}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {customer.addresses?.[0]?.city || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {customer.orderCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {customer.lastOrderDate
                        ? format(
                            new Date(customer.lastOrderDate),
                            "dd MMM yyyy"
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${customer._id}`}
                        className="text-xs font-medium text-[#C48B9F] hover:text-[#0A3A4D] transition-colors"
                      >
                        View
                      </Link>
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
