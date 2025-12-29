import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
  X,
  MapPin,
  ThumbsUp,
  MessageSquare,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Input } from "./ui/input";

interface Comment {
  _id?: string;
  userId: string;
  text: string;
  createdAt: string;
  replies?: any[];
}

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
  comments?: Comment[];
  createdAt: string;
}

const reportTypes = {
  "heavy-traffic": {
    label: "Heavy Traffic",
    color: "bg-purple-600 text-white",
  },
  accident: { label: "Accident", color: "bg-red-600 text-white" },
  construction: { label: "Construction", color: "bg-orange-500 text-white" },
  flood: { label: "Flooded Road", color: "bg-blue-500 text-white" },
  checkpoint: { label: "Police Checkpoint", color: "bg-black text-white" },
};

interface Props {
  report: Report;
  onClose: () => void;
}

export default function ReportDetailModal({ report, onClose }: Props) {
  const queryClient = useQueryClient();
  const typeConfig = reportTypes[report.type as keyof typeof reportTypes];
  const [newComment, setNewComment] = useState("");

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      await api.post(`/reports/${report._id}/comment`, { text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setNewComment("");
      toast.success("Comment added successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add comment");
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/admin/reports/${report._id}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({
        queryKey: ["report-detail", report._id],
      });
      toast.success("Comment deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/admin/reports/${report._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report deleted successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete report");
    },
  });

  const handleDeleteComment = (commentId: string, text: string) => {
    const confirm = prompt(
      `⚠️ DELETE COMMENT\n\n"${text.substring(
        0,
        100
      )}..."\n\nType "DELETE" to confirm:`
    );
    if (confirm === "DELETE") {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleDeleteReport = () => {
    const confirm = prompt(
      `⚠️ DELETE ENTIRE REPORT\n\nThis will permanently delete the report and all its comments.\n\nType "DELETE" to confirm:`
    );
    if (confirm === "DELETE") {
      deleteReportMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(report.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Details */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{report.description}</h2>

            {report.locationName && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{report.locationName}</span>
              </div>
            )}

            {report.photoUrl && (
              <img
                src={report.photoUrl}
                alt="Report"
                className="w-full rounded-lg mb-4"
              />
            )}

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span>{report.upvotes} upvotes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{report.comments?.length || 0} comments</span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <Card className="p-4 bg-slate-50">
            <p className="text-sm font-medium">Reported by:</p>
            <p className="text-sm">{report.userId?.name || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">
              {report.userId?.email}
            </p>
          </Card>

          {/* Add Comment */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Add Admin Comment</h3>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                placeholder="Write your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={addCommentMutation.isPending}
              />
              <Button
                type="submit"
                disabled={addCommentMutation.isPending || !newComment.trim()}
              >
                {addCommentMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </form>
          </Card>

          {/* Comments */}
          {report.comments && report.comments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Comments ({report.comments.length})
              </h3>
              <div className="space-y-4">
                {report.comments.map((comment, index) => (
                  <Card key={comment._id || index} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm mb-2">{comment.text}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 space-y-2">
                            {comment.replies.map(
                              (reply: any, replyIndex: number) => (
                                <div key={replyIndex} className="text-sm">
                                  <p className="mb-1">{reply.text}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                      new Date(reply.createdAt),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      {comment._id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleDeleteComment(comment._id!, comment.text)
                          }
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReport}
              disabled={deleteReportMutation.isPending}
              className="flex-1 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
