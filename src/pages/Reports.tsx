import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Trash2, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";

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

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [countrySearch, setCountrySearch] = useState(emailFromUrl || "");

  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const clearEmailFilter = () => {
    setCountrySearch("");
    setSearchParams({}); // Clear URL params
  };

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["admin-reports", typeFilter],
    queryFn: async () => {
      const params: any = {};
      if (typeFilter !== "all") params.type = typeFilter;

      const res = await api.get("/admin/reports", { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/admin/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
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

  const handleExport = async () => {
    try {
      const response = await api.get("/admin/export/reports", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `reports-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Reports exported successfully");
    } catch (error) {
      toast.error("Failed to export reports");
    }
  };

  const reports = reportsData?.reports || [];

  let filteredReports = reports.filter((report: Report) => {
    const matchesSearch =
      report.description?.toLowerCase().includes(search.toLowerCase()) ||
      (report.locationName &&
        report.locationName.toLowerCase().includes(search.toLowerCase())) ||
      (report.userId?.email &&
        report.userId.email.toLowerCase().includes(search.toLowerCase()));

    const matchesCountry =
      !countrySearch ||
      (report.locationName &&
        report.locationName
          .toLowerCase()
          .includes(countrySearch.toLowerCase()));

    return matchesSearch && matchesCountry;
  });

  if (engagementFilter === "high-engagement") {
    filteredReports = [...filteredReports].sort((a, b) => {
      const scoreA = (a.upvotes || 0) + (a.comments?.length || 0);
      const scoreB = (b.upvotes || 0) + (b.comments?.length || 0);
      return scoreB - scoreA;
    });
  } else if (engagementFilter === "most-upvoted") {
    filteredReports = [...filteredReports].sort(
      (a, b) => b.upvotes - a.upvotes
    );
  } else if (engagementFilter === "most-commented") {
    filteredReports = [...filteredReports].sort(
      (a, b) => (b.comments?.length || 0) - (a.comments?.length || 0)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports Management</h1>
          <p className="text-muted-foreground">
            Moderate traffic reports and remove inappropriate content
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      {emailFromUrl && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  Viewing reports by rider
                </p>
                <p className="text-sm text-blue-700">{emailFromUrl}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEmailFilter}
              className="gap-2 text-blue-700 hover:text-blue-900"
            >
              <X className="h-4 w-4" />
              Clear Filter
            </Button>
          </div>
        </Card>
      )}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Input
            placeholder="Filter by rider email..."
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="all">All Types</option>
            <option value="heavy-traffic">Heavy Traffic</option>
            <option value="accident">Accident</option>
            <option value="construction">Construction</option>
            <option value="flood">Flooded Road</option>
            <option value="checkpoint">Police Checkpoint</option>
          </select>

          <select
            value={engagementFilter}
            onChange={(e) => setEngagementFilter(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="all">All Engagement</option>
            <option value="high-engagement">High Engagement</option>
            <option value="most-upvoted">Most Upvoted</option>
            <option value="most-commented">Most Commented</option>
          </select>

          <Button
            onClick={() => (window.location.href = "/rider-performance")}
            variant="outline"
            className="gap-2"
          >
            Rider Stats
          </Button>
        </div>

        {(countrySearch || engagementFilter !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {countrySearch && (
              <Badge variant="secondary" className="gap-1">
                Location: {countrySearch}
                <button
                  onClick={() => setCountrySearch("")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {engagementFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {engagementFilter === "high-engagement" && "High Engagement"}
                {engagementFilter === "most-upvoted" && "Most Upvoted"}
                {engagementFilter === "most-commented" && "Most Commented"}
                <button
                  onClick={() => setEngagementFilter("all")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Reports Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report: Report) => {
                const typeConfig =
                  reportTypes[report.type as keyof typeof reportTypes];
                return (
                  <TableRow
                    key={report._id}
                    className="cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <TableCell>
                      <Badge className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p
                        className="max-w-xs truncate"
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
                      <div>
                        <p className="text-sm font-medium">
                          {report.userId?.name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.userId?.email}
                        </p>
                      </div>
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

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">
              Content Moderation Guidelines
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Remove reports that contain spam, inappropriate content, false
              information, or violate community guidelines. Deleted reports
              cannot be recovered.
            </p>
          </div>
        </div>
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
