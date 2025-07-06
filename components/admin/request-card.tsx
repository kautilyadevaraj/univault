"use client";

import { useState } from "react";
import { Upload, Edit, Loader2, Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export interface PendingRequest {
  id: string;
  request: string;
  requester: string;
  requestDate: string;
  status: "pending" | "fulfilled";
  school?: string;
  program?: string;
  yearOfCreation?: number;
  courseYear?: string;
  courseName?: string;
  resourceType?: string;
  tags?: string[];
  fulfillUploadURL?: string;
  email?: string[];
  hasResource: boolean;
}

interface RequestCardProps {
  request: PendingRequest;
  // onFulfill: (form: FormData) => Promise<void>;
  // onSendNotification: (requestId: string, template: string) => Promise<void>;
  actionLoading: string | null;
  onOpenFulfill: (request: PendingRequest) => void;
}

export function RequestCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function RequestCard({
  request,
  // onFulfill,
  // onSendNotification,
  actionLoading,
  onOpenFulfill,
}: RequestCardProps) {
  console.log(request);
  const [fulfillmentFile, setFulfillmentFile] = useState<File | null>(null);
  const [emailTemplate, setEmailTemplate] = useState("");
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);

  // const handleFulfill = async () => {
  //   if (!fulfillmentFile) return;

  //   const fd = new FormData();
  //   fd.append("file", fulfillmentFile); // required
  //   fd.append("title", request.request);
  //   fd.append("description", request.request);
  //   fd.append("school", request.school || "");
  //   fd.append("program", request.program || "");
  //   fd.append("yearOfCreation", request.yearOfCreation?.toString() || "");
  //   fd.append("courseYear", request.courseYear || "");
  //   fd.append("courseName", request.courseName || "");
  //   fd.append("resourceType", request.resourceType || "Other");
  //   fd.append("tags", JSON.stringify(request.tags || []));
  //   await onFulfill(fd);
  //   setFulfillmentFile(null);
  // };

  const handleSendNotification = async () => {
    if (emailTemplate.trim()) {
      // await onSendNotification(request.id, emailTemplate);
      setIsNotificationDialogOpen(false);
      setEmailTemplate("");
    }
  };

  const handlePreviewFile = async () => {
    if (request.fulfillUploadURL) {
      try {
        const response = await fetch(
          `/api/resource/download?key=${encodeURIComponent(
            request.fulfillUploadURL
          )}`
        );
        if (response.ok) {
          const { url } = await response.json();
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error("Failed to preview file:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{request.request}</CardTitle>
              {request.hasResource && (
                <Badge variant="secondary" className="text-xs">
                  File uploaded by a user
                </Badge>
              )}             
              {request.email && request.email.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-300"
                >
                  {request.email.length} subscriber(s)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Requested by: {request.requester}</span>
              <span>
                Date: {new Date(request.requestDate).toLocaleDateString()}
              </span>
            </div>
            {request.fulfillUploadURL && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewFile}
                  className="mr-2 bg-transparent"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview File
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => onFulfill(request)}
              disabled={actionLoading?.startsWith("update-request")}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button> */}

            {request.email && request.email.length > 0 && (
              <Dialog
                open={isNotificationDialogOpen}
                onOpenChange={setIsNotificationDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto bg-transparent"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Notify ({request.email.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Notification</DialogTitle>
                    <DialogDescription>
                      Send a notification to {request.email.length}{" "}
                      subscriber(s) about this request.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email-template">Email Template</Label>
                      <textarea
                        id="email-template"
                        className="w-full h-32 p-3 border rounded-md resize-none"
                        placeholder="Enter your email message here..."
                        value={emailTemplate}
                        onChange={(e) => setEmailTemplate(e.target.value)}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>Recipients:</strong> {request.email.join(", ")}
                      </p>
                    </div>
                    <Button
                      onClick={handleSendNotification}
                      disabled={
                        !emailTemplate.trim() ||
                        actionLoading === `notify-${request.id}`
                      }
                      className="w-full"
                    >
                      {actionLoading === `notify-${request.id}` ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Notification"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button
              disabled={actionLoading?.startsWith("fulfill-")}
              onClick={() => onOpenFulfill(request)}
              className="h-8"
            >
              <Upload/>{request.fulfillUploadURL ? "Replace File" : "Fulfill Request"}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
