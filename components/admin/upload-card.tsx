"use client";
import { useState } from "react";
import {
  Check,
  X,
  Eye,
  Edit,
  Loader2,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";

export interface PendingUpload {
  id: string;
  title: string;
  description: string;
  uploader: string;
  uploadDate: string;
  fileType: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
  school?: string;
  program?: string;
  yearOfCreation?: number;
  courseYear?: string;
  courseName?: string;
  resourceType?: string;
  linkedRequestId?: string | null;
  fileUrl: string;
}

interface UploadCardProps {
  upload: PendingUpload;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (upload: PendingUpload) => void;
  actionLoading: string | null;
  hasUnsavedEdits?: boolean;
}

export function UploadCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export function UploadCard({
  upload,
  onApprove,
  onReject,
  onEdit,
  actionLoading,
  hasUnsavedEdits = false,
}: UploadCardProps) {
  console.log(upload)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function fetchSignedUrl() {
    const res = await fetch(
      `/api/resource/download?key=${encodeURIComponent(upload.fileUrl)}`
    );
    if (!res.ok) throw new Error("failed");
    const { url } = await res.json();
    return url as string;
  }

  async function handlePreview() {
    try {
      setLoadingPreview(true);
      const url = previewUrl ?? (await fetchSignedUrl());
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (e) {
      toast.error("Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleDownload() {
    try {
      setDownloading(true);
      const url = previewUrl ?? (await fetchSignedUrl());
      setPreviewUrl(url); // cache for future previews
      window.open(url, "_blank");
      toast.success("Download started!");
    } catch (e) {
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Card
        className={hasUnsavedEdits ? "border-orange-200 bg-orange-50/50" : ""}
      >
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{upload.title}</CardTitle>
                {upload.linkedRequestId && (
                  <Badge variant="secondary" className="text-xs">
                    From Request
                  </Badge>
                )}
                {hasUnsavedEdits && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-300"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Edited
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2">
                {upload.description}
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                {upload.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>Uploaded by: {upload.uploader}</span>
                <span>
                  Date: {new Date(upload.uploadDate).toLocaleDateString()}
                </span>
                <span>Type: {upload.fileType}</span>
              </div>
              {hasUnsavedEdits && (
                <div className="mt-2 text-sm text-orange-600 font-medium">
                  ⚠️ This upload has unsaved changes. Click 'Approve' to apply
                  them.
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto">
              {/* PREVIEW */}
              <Button
                variant="outline"
                className="flex-1 lg:flex-none"
                onClick={handlePreview}
                disabled={loadingPreview}
              >
                {loadingPreview ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {loadingPreview ? "Loading…" : "Preview"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(upload)}
                disabled={actionLoading?.startsWith("update-upload")}
                className="w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(upload.id)}
                disabled={actionLoading === `reject-${upload.id}`}
                className="w-full sm:w-auto"
              >
                {actionLoading === `reject-${upload.id}` ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                {actionLoading === `reject-${upload.id}`
                  ? "Rejecting..."
                  : "Reject"}
              </Button>
              <Button
                size="sm"
                onClick={() => onApprove(upload.id)}
                disabled={actionLoading === `approve-${upload.id}`}
                className="w-full sm:w-auto"
              >
                {actionLoading === `approve-${upload.id}` ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {actionLoading === `approve-${upload.id}`
                  ? "Approving..."
                  : hasUnsavedEdits
                  ? "Apply & Approve"
                  : "Approve"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 flex flex-col">
          <div className="flex-shrink-0 p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl mb-2 pr-8 text-start">
                {upload.title}
              </DialogTitle>
            </DialogHeader>
          </div>

          <ScrollArea className="flex px-6 min-h-0">
            <div className="space-y-4 pb-4 w-full">
              {!previewUrl ? (
                <div className="p-8 text-center border rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Fetching preview…</p>
                </div>
              ) : upload.fileType.toLowerCase() === "pdf" ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-60 sm:h-96 rounded-md border"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full h-64 sm:h-96 object-contain rounded-md border"
                />
              )}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t rounded-b-lg bg-background">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloading ? "Downloading…" : "Download"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
