'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  Zap,
  Database,
  Lock,
  Server,
  Mail,
  FileText,
} from 'lucide-react';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  description: string;
  icon: any;
  lastChecked: Date;
}

export default function SystemStatus() {
  const [isDark, setIsDark] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidentHistory, setIncidentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Simulate fetching system status
    const mockServices: ServiceStatus[] = [
      {
        id: 'api',
        name: 'API Services',
        status: 'operational',
        uptime: 99.98,
        description: 'All API endpoints and services',
        icon: Zap,
        lastChecked: new Date(),
      },
      {
        id: 'database',
        name: 'Database',
        status: 'operational',
        uptime: 99.99,
        description: 'Primary and backup databases',
        icon: Database,
        lastChecked: new Date(),
      },
      {
        id: 'storage',
        name: 'File Storage',
        status: 'operational',
        uptime: 99.97,
        description: 'Cloud storage and CDN',
        icon: Server,
        lastChecked: new Date(),
      },
      {
        id: 'auth',
        name: 'Authentication',
        status: 'operational',
        uptime: 99.99,
        description: 'Login, authentication, and security',
        icon: Lock,
        lastChecked: new Date(),
      },
      {
        id: 'email',
        name: 'Email Service',
        status: 'degraded',
        uptime: 98.5,
        description: 'Transactional and notification emails',
        icon: Mail,
        lastChecked: new Date(),
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'operational',
        uptime: 99.95,
        description: 'Data analytics and reporting',
        icon: TrendingUp,
        lastChecked: new Date(),
      },
    ];

    const mockIncidents = [
      {
        id: 1,
        title: 'Email service briefly unavailable',
        description: 'Email notifications were delayed for approximately 15 minutes',
        status: 'resolved',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
        impact: 'Minor',
      },
      {
        id: 2,
        title: 'Database performance degradation',
        description: 'Experienced higher than usual response times',
        status: 'resolved',
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        impact: 'Moderate',
      },
      {
        id: 3,
        title: 'Scheduled maintenance',
        description: 'Infrastructure upgrades and security patches',
        status: 'resolved',
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        impact: 'Planned',
      },
    ];

    setServices(mockServices);
    setIncidentHistory(mockIncidents);
    setLastUpdated(new Date());
    setLoading(false);
    setIsMounted(true);

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // Simulate real-time status checks
      setServices((prevServices) =>
        prevServices.map((service) => ({
          ...service,
          lastChecked: new Date(),
        }))
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', icon: 'text-green-600 dark:text-green-400' };
      case 'degraded':
        return { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', icon: 'text-yellow-600 dark:text-yellow-400' };
      case 'down':
        return { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', icon: 'text-red-600 dark:text-red-400' };
      default:
        return { bg: 'bg-gray-50 dark:bg-gray-950', text: 'text-gray-700 dark:text-gray-300', icon: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <span className="text-xs font-semibold text-green-700 dark:text-green-300">Operational</span>;
      case 'degraded':
        return <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Degraded</span>;
      case 'down':
        return <span className="text-xs font-semibold text-red-700 dark:text-red-300">Down</span>;
      default:
        return <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Unknown</span>;
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLastUpdated(new Date());
    setServices((prevServices) =>
      prevServices.map((service) => ({
        ...service,
        lastChecked: new Date(),
      }))
    );
    setLoading(false);
  };

  const overallStatus =
    services.length > 0 && services.every((s) => s.status === 'operational') ? 'operational' : services.some((s) => s.status === 'down') ? 'down' : 'degraded';

  const averageUptime = services.length > 0 ? (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2) : '0';

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 bg-white dark:bg-gray-800/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/help" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">System Status</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time platform health and uptime</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                title="Refresh status"
              >
                <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo2.svg" alt="Alton Studio" width={32} height={32} />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 lg:px-6 py-12">
          {/* Overall Status */}
          <div className={`rounded-2xl p-8 mb-8 border ${overallStatus === 'operational' ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20' : overallStatus === 'degraded' ? 'border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20' : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'}`}>
            <div className="flex items-center gap-4 mb-4">
              {overallStatus === 'operational' ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : overallStatus === 'degraded' ? (
                <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {overallStatus === 'operational' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Service Degradation' : 'Service Outage'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Last updated: {isMounted && lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {overallStatus === 'operational'
                ? 'All systems are running smoothly. Users should not experience any service disruptions.'
                : overallStatus === 'degraded'
                  ? 'Some services may be experiencing slower than normal performance. We are actively working to resolve the issue.'
                  : 'One or more critical services are currently unavailable. Our team is investigating.'}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">24h Status</span>
              </div>
              <h3 className="text-3xl font-bold">{averageUptime}%</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Average Uptime</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Services</span>
              </div>
              <h3 className="text-3xl font-bold">{services.filter((s) => s.status === 'operational').length}/{services.length}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fully Operational</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Last Incident</span>
              </div>
              <h3 className="text-3xl font-bold">2d ago</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Email Service Issue</p>
            </div>
          </div>

          {/* Services Status */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6">Service Status</h2>
            <div className="space-y-3">
              {services.map((service) => {
                const colors = getStatusColor(service.status);
                const Icon = service.icon;
                return (
                  <div key={service.id} className={`${colors.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Icon className={`w-6 h-6 ${colors.icon} mt-1 flex-shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{service.name}</h3>
                            {getStatusBadge(service.status)}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-400">{service.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold">{service.uptime}%</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Uptime (30d)</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident History */}
          <div>
            <h2 className="text-xl font-bold mb-6">Incident History</h2>
            <div className="space-y-4">
              {incidentHistory.map((incident: any) => (
                <div key={incident.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${incident.status === 'resolved' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'}`}
                        >
                          {incident.status === 'resolved' ? 'Resolved' : 'Investigating'}
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${incident.impact === 'Minor' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : incident.impact === 'Moderate' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                          {incident.impact}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{incident.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Started: {incident.startTime.toLocaleString()}</span>
                        <span>Ended: {incident.endTime.toLocaleString()}</span>
                        <span>Duration: {Math.floor((incident.endTime - incident.startTime) / (1000 * 60))} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For more information or to report an issue, please contact{' '}
              <a href="mailto:support@altonstudio.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                support@altonstudio.com
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
