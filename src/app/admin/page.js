'use client';

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminApiService from "@/services/adminApiService";
import { useAuth } from "@/components/providers/AuthProvider";

// Stats component for dashboard metrics
const StatCard = ({ title, value, icon, color, href }) => (
  <Link href={href || "#"} className="block">
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center hover:shadow-lg transition-shadow">
      <div className={`rounded-full p-3 mr-4 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value !== undefined ? value : "..."}</p>
      </div>
    </div>
  </Link>
);

// Admin action card component
const ActionCard = ({ title, description, icon, href, color }) => (
  <Link 
    href={href} 
    className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors flex flex-col h-full"
  >
    <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${color}`}>
      {icon}
    </div>
    <h4 className="font-medium text-lg mb-2">{title}</h4>
    <p className="text-sm text-gray-500 flex-grow">{description}</p>
    <div className="mt-4 text-blue-600 text-sm font-medium flex items-center">
      Manage
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </Link>
);

// Client-side component for the admin dashboard
export default function AdminPage() {
  const { data: session, status } = useSession();
  const { token, isAdmin, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    users: null,
    partners: null,
    locations: null,
    osTemplates: null,
    osTemplateGroups: null,
    brands: null,
    invoices: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      redirect('/login?callbackUrl=/admin');
      return;
    }
    
    const fetchStats = async () => {
      if (!token || authLoading) return;
      
      try {
        setLoading(true);
        
        // Fetch all stats in parallel
        const [
          usersData,
          partnersData,
          locationsData,
          osTemplatesData,
          osTemplateGroupsData,
          brandsData,
          invoicesData
        ] = await Promise.all([
          AdminApiService.getUsers(token),
          AdminApiService.getPartners(token),
          AdminApiService.getLocations(token),
          AdminApiService.getOsTemplates(token),
          AdminApiService.getOsTemplateGroups(token),
          AdminApiService.getBrands(token),
          AdminApiService.getInvoices(token)
        ]);
        
        setStats({
          users: usersData.meta?.total || 0,
          partners: partnersData.meta?.total || 0,
          locations: locationsData.meta?.total || 0,
          osTemplates: osTemplatesData.meta?.total || 0,
          osTemplateGroups: osTemplateGroupsData.meta?.total || 0,
          brands: brandsData.meta?.total || 0,
          invoices: invoicesData.meta?.total || 0
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token, status, authLoading]);

  // Show loading state while auth is being determined
  if (status === "loading" || authLoading) {
    return <div className="flex justify-center items-center h-full p-10">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full mx-auto mb-4 animate-spin"></div>
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>;
  }

  // If not authenticated or not admin, redirect to login
  if (!session || !isAdmin) {
    redirect("/login?callbackUrl=/admin");
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Users"
            value={loading ? "..." : stats.users?.toLocaleString()}
            href="/admin/users"
            color="bg-blue-100"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Partners"
            value={loading ? "..." : stats.partners?.toLocaleString()}
            href="/admin/partners"
            color="bg-green-100"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            title="Locations"
            value={loading ? "..." : stats.locations?.toLocaleString()}
            href="/admin/locations"
            color="bg-yellow-100"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            title="Invoices"
            value={loading ? "..." : stats.invoices?.toLocaleString()}
            href="/admin/invoices"
            color="bg-purple-100"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-3m3 3v-6m3 6v-8m6 0a3 3 0 11-6 0 3 3 0 016 0zM9 22h6c.828 0 1.573-.422 2.036-1.092a4.8 4.8 0 00-5.696-5.696C10.422 15.427 9.8 16.172 9 17h0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* OS Templates Section */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="OS Templates"
            value={loading ? "..." : stats.osTemplates?.toLocaleString()}
            href="/admin/os-templates"
            color="bg-indigo-100"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
              </svg>
            }
          />
          <StatCard
            title="OS Template Groups"
            value={loading ? "..." : stats.osTemplateGroups?.toLocaleString()}
            href="/admin/os-template-groups"
            color="bg-pink-100"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          />
          <StatCard
            title="Brands"
            value={loading ? "..." : stats.brands?.toLocaleString()}
            href="/admin/brands"
            color="bg-teal-100"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
