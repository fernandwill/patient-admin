"use client";

import { useEffect, useState } from "react";
import ContentWrapper from '@/components/layout/ContentWrapper';
import { apiFetch } from "@/lib/api";
import { formatRegTime } from "@/lib/formatters";
import Link from "next/link";

interface DashboardStats {
  totalPatients: number;
  totalRegistrations: number;
  todayRegistrations: number;
}

interface RecentActivity {
  id: number;
  registration_no: string;
  registration_date: string;
  full_name: string;
  medical_record_no: string;
}

interface LatestPatient {
  id: number;
  full_name: string;
  medical_record_no: string;
  created_at: string;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [latestPatients, setLatestPatients] = useState<LatestPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiFetch("/api/stats");
        if (!response.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
        setLatestPatients(data.latestPatients);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <ContentWrapper title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
            <p className="text-gray-500">Loading clinic statistics...</p>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Dashboard">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center gap-3">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Box: Total Patients */}
        <div className="bg-blue-500 text-white rounded shadow p-4 relative overflow-hidden transition-transform hover:scale-[1.02]">
          <div className="inner">
            <h3 className="text-3xl font-bold">{stats?.totalPatients || 0}</h3>
            <p>Total Patients</p>
          </div>
          <div className="icon absolute top-2 right-2 opacity-30">
            <i className="fas fa-users text-6xl"></i>
          </div>
          <Link href="/patients" className="block mt-4 text-center text-sm bg-blue-600 bg-opacity-30 hover:bg-opacity-50 py-1 rounded">
            View Patient List <i className="fas fa-arrow-circle-right"></i>
          </Link>
        </div>

        {/* Box: Total Registrations */}
        <div className="bg-green-500 text-white rounded shadow p-4 relative overflow-hidden transition-transform hover:scale-[1.02]">
          <div className="inner">
            <h3 className="text-3xl font-bold">{stats?.totalRegistrations || 0}</h3>
            <p>Total Registrations</p>
          </div>
          <div className="icon absolute top-2 right-2 opacity-30">
            <i className="fas fa-file-medical text-6xl"></i>
          </div>
          <Link href="/registrations" className="block mt-4 text-center text-sm bg-green-600 bg-opacity-30 hover:bg-opacity-50 py-1 rounded">
            View Registrations <i className="fas fa-arrow-circle-right"></i>
          </Link>
        </div>

        {/* Box: Today's Registrations */}
        <div className="bg-yellow-500 text-white rounded shadow p-4 relative overflow-hidden transition-transform hover:scale-[1.02]">
          <div className="inner">
            <h3 className="text-3xl font-bold">{stats?.todayRegistrations || 0}</h3>
            <p>Today's Registrations</p>
          </div>
          <div className="icon absolute top-2 right-2 opacity-30">
            <i className="fas fa-calendar-check text-6xl"></i>
          </div>
          <Link href="/registrations" className="block mt-4 text-center text-sm bg-yellow-600 bg-opacity-30 hover:bg-opacity-50 py-1 rounded">
            Check Schedule <i className="fas fa-arrow-circle-right"></i>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="bg-card rounded shadow border border-border overflow-hidden transition-colors duration-300">
          <div className="p-4 border-b border-border bg-navbar flex justify-between items-center transition-colors duration-300">
            <h3 className="text-lg font-semibold text-foreground">Recent Registrations</h3>
            <i className="fas fa-clock text-gray-400"></i>
          </div>
          <div className="p-0">
            {recentActivity.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentActivity.map((reg) => (
                  <li key={reg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{reg.full_name}</p>
                        <p className="text-xs text-gray-500">RM: {reg.medical_record_no} | Reg: {reg.registration_no}</p>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                        {formatRegTime(reg.registration_date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No recent registrations found.</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-navbar border-t border-border text-center transition-colors duration-300">
            <Link href="/registrations" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View All Registrations
            </Link>
          </div>
        </div>

        {/* Latest Patients */}
        <div className="bg-card rounded shadow border border-border overflow-hidden transition-colors duration-300">
          <div className="p-4 border-b border-border bg-navbar flex justify-between items-center transition-colors duration-300">
            <h3 className="text-lg font-semibold text-foreground">Latest Patients</h3>
            <i className="fas fa-user-plus text-gray-400"></i>
          </div>
          <div className="p-0">
            {latestPatients.length > 0 ? (
              <ul className="divide-y divide-border">
                {latestPatients.map((patient) => (
                  <li key={patient.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{patient.full_name}</p>
                        <p className="text-xs text-gray-500">Medical Record: {patient.medical_record_no}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Added {new Date(patient.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No patients found.</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-navbar border-t border-border text-center transition-colors duration-300">
            <Link href="/patients" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View All Patients
            </Link>
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
}
