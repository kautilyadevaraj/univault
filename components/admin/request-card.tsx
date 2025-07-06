"use client";

import { useState, useTransition } from "react";
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
import { toast } from "sonner";

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
  
  const [fulfillmentFile, setFulfillmentFile] = useState<File | null>(null);
  const [emailTemplate, setEmailTemplate] = useState("");
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [isPending, startTransition] = useTransition();

  async function sendNotification() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: request.id,
            resourceId: request.fulfillUploadURL
              ? request.id /* or linkedResourceId */
              : null,
            template: emailTemplate,
          }),
        });

        if (!res.ok)
          throw new Error((await res.json()).error ?? "Unknown error");

        toast.success("E-mail sent to all subscribers 🎉");
        setIsNotificationDialogOpen(false);
        setEmailTemplate("");
      } catch (err: any) {
        toast.error(`Failed to send e-mail: ${err.message}`);
      }
    });
  }

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
              <span>
                Requested by:{" "}
                {request.requester && request.requester.length > 0
                  ? request.requester
                  : "No one."}
              </span>
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
                      <Label htmlFor="template" className="mb-1 mt-4 block">
                        Email text
                      </Label>
                      <Input
                        id="template"
                        value={emailTemplate}
                        onChange={(e) => setEmailTemplate(e.target.value)}
                        placeholder="Optional personal message…"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>Recipients:</strong> {request.email.join(", ")}
                      </p>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsNotificationDialogOpen(false)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={sendNotification}
                        disabled={isPending || !emailTemplate.trim()}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-1" />
                        )}
                        {isPending
                          ? "Sending…"
                          : `Send (${request.email.length})`}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button
              disabled={actionLoading?.startsWith("fulfill-")}
              onClick={() => onOpenFulfill(request)}
              className="h-8"
            >
              <Upload />
              {request.fulfillUploadURL ? "Replace File" : "Fulfill Request"}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
