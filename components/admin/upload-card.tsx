"use client";
import { Check, X, Eye, Edit, Loader2, AlertCircle } from "lucide-react";
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
        <div className="flex justify-between items-start">
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
  return (
    <Card
      className={hasUnsavedEdits ? "border-orange-200 bg-orange-50/50" : ""}
    >
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{upload.title}</CardTitle>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto bg-transparent"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>File Preview</DialogTitle>
                  <DialogDescription>
                    Preview functionality would be implemented here
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-muted p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">
                    File preview not available in demo
                  </p>
                </div>
              </DialogContent>
            </Dialog>
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
  );
}
