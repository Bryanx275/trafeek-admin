import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Analytics {
  users: {
    total: number;
    free: number;
    premium: number;
    suspended: number;
  };
  reports: {
    total: number;
    today: number;
  };
  subscriptions: {
    active: number;
  };
  revenue: {
    total: number;
  };
  recent: {
    users: Array<{
      _id: string;
      email: string;
      name?: string;
      role: string;
      createdAt: string;
    }>;
    reports: Array<{
      _id: string;
      type: string;
      description: string;
      userId: { email: string; name?: string };
      createdAt: string;
    }>;
  };
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: analytics?.users.total || 0,
      icon: Users,
      description: `${analytics?.users.free || 0} free, ${analytics?.users.premium || 0} premium`,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Reports",
      value: analytics?.reports.total || 0,
      icon: FileText,
      description: `${analytics?.reports.today || 0} today`,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Active Subscriptions",
      value: analytics?.subscriptions.active || 0,
      icon: TrendingUp,
      description: "Current active subs",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `₦${(analytics?.revenue.total || 0).toLocaleString()}`,
      icon: DollarSign,
      description: "All-time earnings",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Trafeek platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recent.users.map((user) => (
                <div key={user._id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recent.reports.slice(0, 5).map((report) => (
                <div key={report._id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {report.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{report.description}</p>
                  <p className="text-xs text-muted-foreground">
                    By: {report.userId?.name || report.userId?.email}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
