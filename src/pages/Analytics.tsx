import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Eye,
  UserPlus,
  TrendingUp,
  Clock,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const COLORS = {
  mobile: "#3b82f6",
  desktop: "#10b981",
  tablet: "#f59e0b",
};

export default function Analytics() {
  const [period, setPeriod] = useState("7d");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const res = await api.get("/analytics/dashboard", {
        params: { period },
      });
      return res.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: realtime } = useQuery({
    queryKey: ["analytics-realtime"],
    queryFn: async () => {
      const res = await api.get("/analytics/realtime");
      return res.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const charts = analytics?.charts || {};

  // Format device data for pie chart
  const deviceData =
    charts.deviceBreakdown?.map((item: any) => ({
      name: item._id,
      value: item.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Platform usage and visitor insights
          </p>
        </div>

        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background"
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Real-time Stats */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Now</p>
            <p className="text-2xl font-bold text-green-900">
              {realtime?.activeUsers || 0} users
            </p>
          </div>
        </div>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Views</p>
              <p className="text-2xl font-bold">
                {overview.totalPageViews?.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Visitors</p>
              <p className="text-2xl font-bold">
                {overview.uniqueVisitors?.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sign-ups</p>
              <p className="text-2xl font-bold">{overview.signups}</p>
              <p className="text-xs text-green-600">
                {overview.conversionRate}% conversion
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <MousePointerClick className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bounce Rate</p>
              <p className="text-2xl font-bold">{overview.bounceRate}%</p>
              <p className="text-xs text-muted-foreground">
                Avg: {overview.avgSessionDuration}s
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Page Views */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Page Views</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.dailyViews}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Page Views"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Device Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name as keyof typeof COLORS] || "#999"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Mobile</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-green-500" />
              <span className="text-sm">Desktop</span>
            </div>
            <div className="flex items-center gap-2">
              <Tablet className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Tablet</span>
            </div>
          </div>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Viewed Pages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.pageViewsByPage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Traffic Sources */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Traffic Sources</h3>
          <div className="space-y-3">
            {charts.trafficSources?.length > 0 ? (
              charts.trafficSources
                .slice(0, 8)
                .map((source: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {source._id || "Direct"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{source.count}</span>
                      <span className="text-xs text-muted-foreground">
                        views
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No referrer data available
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Page Views</h3>
        <div className="space-y-2">
          {realtime?.recentPageViews?.map((view: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {view.device === "mobile" && (
                  <Smartphone className="h-4 w-4 text-blue-500" />
                )}
                {view.device === "desktop" && (
                  <Monitor className="h-4 w-4 text-green-500" />
                )}
                {view.device === "tablet" && (
                  <Tablet className="h-4 w-4 text-orange-500" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {view.pageTitle || view.pagePath}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {view.pagePath}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(view.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
