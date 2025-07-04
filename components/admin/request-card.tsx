"use client";

import { useState } from "react";
import { Upload, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  status: "open" | "fulfilled";
  school?: string;
  program?: string;
  yearOfCreation?: number;
  courseYear?: string;
  courseName?: string;
  resourceType?: string;
  tags?: string[];
}

interface RequestCardProps {
  request: PendingRequest;
  onFulfill: (id: string, file: File) => Promise<void>;
  onEdit: (request: PendingRequest) => void;
  actionLoading: string | null;
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
  onFulfill,
  onEdit,
  actionLoading,
}: RequestCardProps) {
  const [fulfillmentFile, setFulfillmentFile] = useState<File | null>(null);

  const handleFulfill = async () => {
    if (fulfillmentFile) {
      await onFulfill(request.id, fulfillmentFile);
      setFulfillmentFile(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{request.request}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Requested by: {request.requester}</span>
              <span>
                Date: {new Date(request.requestDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(request)}
              disabled={actionLoading?.startsWith("update-request")}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={actionLoading === `fulfill-${request.id}`}
                  className="w-full sm:w-auto"
                >
                  {actionLoading === `fulfill-${request.id}` ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {actionLoading === `fulfill-${request.id}`
                    ? "Fulfilling..."
                    : "Fulfill"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fulfill Request</DialogTitle>
                  <DialogDescription>
                    Upload a file to fulfill this request
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fulfillment-file">Upload File</Label>
                    <Input
                      id="fulfillment-file"
                      type="file"
                      onChange={(e) =>
                        setFulfillmentFile(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <Button
                    onClick={handleFulfill}
                    disabled={
                      !fulfillmentFile ||
                      actionLoading === `fulfill-${request.id}`
                    }
                    className="w-full"
                  >
                    {actionLoading === `fulfill-${request.id}` ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fulfilling Request...
                      </>
                    ) : (
                      "Fulfill Request"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
