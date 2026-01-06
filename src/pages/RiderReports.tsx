import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReportDetailModal from "@/components/ReportDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Trash2, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Report {
  _id: string;
  type: string;
  description: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  userId: {
    _id: string;
    email: string;
    name?: string;
  };
  upvotes: number;
  comments?: any[];
  createdAt: string;
}

const reportTypes = {
  "heavy-traffic": {
    label: "Heavy Traffic",
    color: "bg-purple-100 text-purple-700",
  },
  accident: { label: "Accident", color: "bg-red-100 text-red-700" },
  construction: {
    label: "Construction",
    color: "bg-orange-100 text-orange-700",
  },
  flood: { label: "Flooded Road", color: "bg-blue-100 text-blue-700" },
  checkpoint: {
    label: "Police Checkpoint",
    color: "bg-gray-100 text-gray-700",
  },
};

export default function RiderReports() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const riderEmail = searchParams.get("email");
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["rider-reports", riderEmail],
    queryFn: async () => {
      const res = await api.get("/admin/reports");
      return res.data;
    },
    enabled: !!riderEmail,
  });

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/admin/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-reports"] });
      toast.success("Report deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete report");
    },
  });

  const handleDelete = (reportId: string, description: string) => {
    const confirm = prompt(
      `⚠️ DELETE REPORT\n\n"${description.substring(
        0,
        100
      )}..."\n\nType "DELETE" to confirm:`
    );
    if (confirm === "DELETE") {
      deleteMutation.mutate(reportId);
    }
  };

  if (!riderEmail) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No rider selected</p>
          <Button
            onClick={() => navigate("/rider-performance")}
            className="mt-4"
          >
            Go to Rider Performance
          </Button>
        </Card>
      </div>
    );
  }

  const reports = reportsData?.reports || [];
  const riderReports = reports.filter(
    (report: Report) =>
      report.userId?.email?.toLowerCase() === riderEmail.toLowerCase()
  );

  const totalReports = riderReports.length;
  const totalUpvotes = riderReports.reduce(
    (sum: number, r: Report) => sum + (r.upvotes || 0),
    0
  );
  const totalComments = riderReports.reduce(
    (sum: number, r: Report) => sum + (r.comments?.length || 0),
    0
  );

  const riderName =
    riderReports.length > 0 ? riderReports[0].userId?.name || "—" : "—";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/rider-performance")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Rider Performance
      </Button>

      {/* Rider Info Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-blue-900">{riderName}</h1>
            <p className="text-blue-700 font-mono text-sm">{riderEmail}</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold">{totalReports}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Upvotes</p>
              <p className="text-2xl font-bold">{totalUpvotes}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Comments</p>
              <p className="text-2xl font-bold">{totalComments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Reports by {riderName}</h2>
          <p className="text-sm text-muted-foreground">
            Showing {riderReports.length} report
            {riderReports.length !== 1 && "s"}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : riderReports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No reports found for this rider
                </TableCell>
              </TableRow>
            ) : (
              riderReports.map((report: Report) => {
                const typeConfig =
                  reportTypes[report.type as keyof typeof reportTypes];
                return (
                  <TableRow
                    key={report._id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedReport(report)}
                  >
                    <TableCell>
                      <Badge className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p
                        className="max-w-md truncate"
                        title={report.description}
                      >
                        {report.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate">
                        {report.locationName || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{report.upvotes} upvotes</p>
                        <p className="text-muted-foreground">
                          {report.comments?.length || 0} comments
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(report._id, report.description);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
