"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useState, useEffect } from "react";
import { Upload, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Import our new components
import { StatsCards } from "@/components/admin/stats-cards";
import {
  UploadCard,
  UploadCardSkeleton,
  type PendingUpload,
} from "@/components/admin/upload-card";
import {
  RequestCard,
  RequestCardSkeleton,
  type PendingRequest,
} from "@/components/admin/request-card";
import { UsersTable, type User } from "@/components/admin/users-table";
import { EditUploadDialog } from "@/components/admin/edit-upload-dialog";
import { EditRequestDialog } from "@/components/admin/edit-request-dialog";
import { FulfillRequestDialog } from "@/components/admin/fulfill-request-dialog";

interface AdminData {
  uploads: PendingUpload[];
  requests: PendingRequest[];
  users: User[];
}

interface PendingUploadEdit {
  uploadId: string;
  title: string;
  description: string;
  school: string;
  customSchool: string;
  program: string;
  yearOfCreation: string;
  courseYear: string;
  courseName: string;
  resourceType: string;
  tags: string[];
  file?: File;
  fileUrl: string;
}

export default function AdminPage() {
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUpload, setEditingUpload] = useState<PendingUpload | null>(
    null
  );
  const [fulfillingRequest, setFulfillingRequest] =
    useState<PendingRequest | null>(null);
  const [isEditUploadDialogOpen, setIsEditUploadDialogOpen] = useState(false);
  const [isFulfillDialogOpen, setIsFulfillDialogOpen] = useState(false);
  const [fulfillingReq, setFulfillingReq] = useState<PendingRequest | null>(
    null
  );

  // Store pending edits for uploads - only applied when approved
  const [pendingUploadEdits, setPendingUploadEdits] = useState<
    Record<string, PendingUploadEdit>
  >({});

  const { data, error, isLoading, mutate } = useSWR<AdminData>(
    "/api/admin/overview",
    fetcher
  );

  // Update local state when data is fetched
  useEffect(() => {
    if (data) {
      setUploads(data.uploads || []);
      setRequests(data.requests || []);
      setUsers(data.users || []);
    }
  }, [data]);

  const handleAdminFulfil = (request: PendingRequest) => {
    setFulfillingReq(request);
    setIsEditUploadDialogOpen(true);
  };

  const handleApproveUpload = async (id: string) => {
    setActionLoading(`approve-${id}`);
    try {
      let response;

      // Check if we have pending edits for this upload
      const pendingEdit = pendingUploadEdits[id];

      if (pendingEdit) {
        // Approve with edits
        const formData = new FormData();
        formData.append("title", pendingEdit.title);
        formData.append("description", pendingEdit.description);
        formData.append(
          "school",
          pendingEdit.school === "Others"
            ? pendingEdit.customSchool
            : pendingEdit.school
        );
        formData.append("program", pendingEdit.program);
        formData.append("yearOfCreation", pendingEdit.yearOfCreation);
        formData.append("courseYear", pendingEdit.courseYear);
        formData.append("courseName", pendingEdit.courseName);
        formData.append("resourceType", pendingEdit.resourceType);
        formData.append("tags", JSON.stringify(pendingEdit.tags));

        if (pendingEdit.file) {
          formData.append("file", pendingEdit.file);
        }

        response = await fetch(`/api/admin/uploads/${id}/approve`, {
          method: "POST",
          body: formData,
        });

        // Clear pending edit after successful approval
        setPendingUploadEdits((prev) => {
          const newEdits = { ...prev };
          delete newEdits[id];
          return newEdits;
        });
      } else {
        // Simple approval without edits
        response = await fetch(`/api/admin/uploads/${id}/approve`, {
          method: "POST",
        });
      }

      if (!response.ok) {
        throw new Error("Failed to approve upload");
      }

      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id ? { ...upload, status: "approved" as const } : upload
        )
      );
      toast.success("Upload approved successfully");
      mutate();
    } catch (error) {
      toast.error("Failed to approve upload");
      console.error("Error approving upload:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUpload = async (id: string) => {
    setActionLoading(`reject-${id}`);
    try {
      const response = await fetch(`/api/admin/uploads/${id}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reject upload");
      }

      // Clear any pending edits for this upload
      setPendingUploadEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[id];
        return newEdits;
      });

      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id ? { ...upload, status: "rejected" as const } : upload
        )
      );
      toast.success("Upload rejected");
      mutate();
    } catch (error) {
      toast.error("Failed to reject upload");
      console.error("Error rejecting upload:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFulfillRequest = async (form: FormData) => {
    if (!fulfillingRequest) return;
    const id = fulfillingRequest.id;
    setActionLoading(`fulfill-${id}`);
    try {
      const res = await fetch(`/api/admin/requests/${id}/fulfill`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Failed");
      // Optimistically mark as fulfilled
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "fulfilled" } : r))
      );
      toast.success("Request fulfilled");
      mutate();
      setIsFulfillDialogOpen(false);
    } catch (e) {
      toast.error("Could not fulfil request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserRole = async (id: string) => {
    setActionLoading(`role-${id}`);
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      const newRole = user.role === "admin" ? "member" : "admin";

      const response = await fetch(`/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id
            ? { ...user, role: newRole as "admin" | "member" }
            : user
        )
      );
      toast.success("User role updated");
      mutate();
    } catch (error) {
      toast.error("Failed to update user role");
      console.error("Error updating user role:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUpload = (upload: PendingUpload) => {
    setEditingUpload(upload);
    setIsEditUploadDialogOpen(true);
  };

  const handleOpenFulfill = (req: PendingRequest) => {
    setFulfillingRequest(req);
    setIsFulfillDialogOpen(true);
  };

  // Updated to only store edits in state, not call API
  const handleSaveUploadEdits = async (editData: any) => {
    if (!editingUpload) return;

    // Store the edits in state instead of calling API
    setPendingUploadEdits((prev) => ({
      ...prev,
      [editingUpload.id]: {
        uploadId: editingUpload.id,
        ...editData,
      },
    }));

    // Update the local upload display with edited data
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === editingUpload.id
          ? {
              ...upload,
              title: editData.title,
              description: editData.description,
              school:
                editData.school === "Others"
                  ? editData.customSchool
                  : editData.school,
              program: editData.program,
              yearOfCreation: Number.parseInt(editData.yearOfCreation),
              courseYear: editData.courseYear,
              courseName: editData.courseName,
              resourceType: editData.resourceType,
              tags: editData.tags,
            }
          : upload
      )
    );

    setIsEditUploadDialogOpen(false);
    setEditingUpload(null);
    toast.success("Changes saved! Click 'Approve' to apply them.");
  };

  // Helper function to get display data for upload (with pending edits applied)
  const getUploadDisplayData = (upload: PendingUpload) => {
    const pendingEdit = pendingUploadEdits[upload.id];
    if (!pendingEdit) return upload;

    return {
      ...upload,
      title: pendingEdit.title,
      description: pendingEdit.description,
      school:
        pendingEdit.school === "Others"
          ? pendingEdit.customSchool
          : pendingEdit.school,
      program: pendingEdit.program,
      yearOfCreation: Number.parseInt(pendingEdit.yearOfCreation),
      courseYear: pendingEdit.courseYear,
      courseName: pendingEdit.courseName,
      resourceType: pendingEdit.resourceType,
      tags: pendingEdit.tags,
    };
  };

  // Helper function to check if upload has pending edits
  const hasUploadPendingEdits = (uploadId: string) => {
    return !!pendingUploadEdits[uploadId];
  };

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle className="text-red-600 mb-4">
                Failed to load admin data
              </CardTitle>
              <CardDescription className="mb-6">
                There was an error loading the admin dashboard. Please try
                refreshing the page.
              </CardDescription>
              <Button onClick={() => mutate()} variant="outline">
                Try Again
              </Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const pendingUploads = uploads.filter(
    (upload) => upload.status === "pending"
  );
  const openRequests = requests.filter(
    (request) => request.status === "pending"
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage uploads, requests, and users for the UniVault community
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          pendingUploads={pendingUploads.length}
          openRequests={openRequests.length}
          totalUsers={users.length}
          isLoading={isLoading}
        />

        <Tabs defaultValue="uploads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="uploads">
              Pending Uploads
              {!isLoading && pendingUploads.length > 0 && (
                <Badge variant="destructive">{pendingUploads.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Pending Requests
              {!isLoading && openRequests.length > 0 && (
                <Badge variant="destructive">{openRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads" className="space-y-4">
            {isLoading ? (
              <>
                <UploadCardSkeleton />
                <UploadCardSkeleton />
                <UploadCardSkeleton />
              </>
            ) : pendingUploads.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending uploads</p>
                </CardContent>
              </Card>
            ) : (
              pendingUploads.map((upload) => (
                <UploadCard
                  key={upload.id}
                  upload={getUploadDisplayData(upload)}
                  onApprove={handleApproveUpload}
                  onReject={handleRejectUpload}
                  onEdit={handleEditUpload}
                  actionLoading={actionLoading}
                  hasUnsavedEdits={hasUploadPendingEdits(upload.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {isLoading ? (
              <>
                <RequestCardSkeleton />
                <RequestCardSkeleton />
                <RequestCardSkeleton />
              </>
            ) : openRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              openRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onOpenFulfill={handleOpenFulfill}
                  actionLoading={actionLoading}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="users">
            <UsersTable
              users={users}
              onToggleRole={handleToggleUserRole}
              actionLoading={actionLoading}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Dialogs */}
        <EditUploadDialog
          upload={editingUpload}
          isOpen={isEditUploadDialogOpen}
          onClose={() => {
            setIsEditUploadDialogOpen(false);
            setEditingUpload(null);
          }}
          onUpdate={handleSaveUploadEdits}
          actionLoading={actionLoading}
        />

        <FulfillRequestDialog
          request={fulfillingRequest}
          isOpen={isFulfillDialogOpen}
          onClose={() => setIsFulfillDialogOpen(false)}
          onFulfill={handleFulfillRequest}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
}
