import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function RiderPerformance() {
  const navigate = useNavigate();
  const [emailFilter, setEmailFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["rider-performance", startDate, endDate, emailFilter],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (emailFilter) params.email = emailFilter;

      const res = await api.get("/admin/rider-performance", { params });
      return res.data;
    },
  });

  const handleExport = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/admin/export/rider-performance", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `rider-performance-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Performance data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const riders = data?.riders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rider Performance</h1>
          <p className="text-muted-foreground">
            Track rider activity and calculate commissions
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
          <Input
            placeholder="Search by email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setEmailFilter("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Riders</p>
                <p className="text-2xl font-bold">{data.summary.totalRiders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">
                  {data.summary.totalReports}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Date Range</p>
              <p className="text-sm">
                {data.summary.dateRange.start} → {data.summary.dateRange.end}
              </p>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Rider Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Total Reports</TableHead>
              <TableHead className="text-right">Heavy Traffic</TableHead>
              <TableHead className="text-right">Accidents</TableHead>
              <TableHead className="text-right">Construction</TableHead>
              <TableHead className="text-right">Floods</TableHead>
              <TableHead className="text-right">Checkpoints</TableHead>
              <TableHead className="text-right">Upvotes</TableHead>
              <TableHead className="text-right">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : riders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data found for the selected period
                </TableCell>
              </TableRow>
            ) : (
              riders.map((rider: any, index: number) => (
                <TableRow
                  key={rider.email}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() =>
                    navigate(
                      `/rider-reports?email=${encodeURIComponent(rider.email)}`
                    )
                  }
                >
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {rider.email}
                  </TableCell>
                  <TableCell>{rider.name}</TableCell>
                  <TableCell className="text-right font-bold">
                    {rider.totalReports}
                  </TableCell>
                  <TableCell className="text-right">
                    {rider.byType["heavy-traffic"]}
                  </TableCell>
                  <TableCell className="text-right">
                    {rider.byType.accident}
                  </TableCell>
                  <TableCell className="text-right">
                    {rider.byType.construction}
                  </TableCell>
                  <TableCell className="text-right">
                    {rider.byType.flood}
                  </TableCell>
                  <TableCell className="text-right">
                    {rider.byType.checkpoint}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {rider.totalUpvotes}
                  </TableCell>
                  <TableCell className="text-right text-blue-600">
                    {rider.totalComments}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
