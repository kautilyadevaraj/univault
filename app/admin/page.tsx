"use client";

import { useState } from "react";
import { Check, X, Upload, MessageSquare, Users, Eye } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";

interface PendingUpload {
  id: string;
  title: string;
  description: string;
  uploader: string;
  uploadDate: string;
  fileType: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
}

interface PendingRequest {
  id: string;
  request: string;
  requester: string;
  requestDate: string;
  status: "open" | "fulfilled";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
  joinDate: string;
  uploads: number;
  requests: number;
}

const mockUploads: PendingUpload[] = [
  {
    id: "1",
    title: "Advanced Algorithms Final 2023",
    description:
      "Complete final exam with detailed solutions covering dynamic programming, graph algorithms, and complexity analysis.",
    uploader: "Alice Johnson",
    uploadDate: "2024-01-15",
    fileType: "PDF",
    tags: ["Algorithms", "Final", "2023", "Computer Science"],
    status: "pending",
  },
  {
    id: "2",
    title: "Organic Chemistry Lab Manual",
    description:
      "Laboratory procedures and safety guidelines for organic chemistry experiments.",
    uploader: "Bob Smith",
    uploadDate: "2024-01-14",
    fileType: "PDF",
    tags: ["Chemistry", "Lab", "Manual", "Organic"],
    status: "pending",
  },
];

const mockRequests: PendingRequest[] = [
  {
    id: "1",
    request: "Linear Algebra Midterm 2023 with solutions",
    requester: "Sarah Chen",
    requestDate: "2024-01-16",
    status: "open",
  },
  {
    id: "2",
    request: "Database Systems Project Examples",
    requester: "Anonymous",
    requestDate: "2024-01-15",
    status: "open",
  },
];

const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@university.edu",
    role: "member",
    joinDate: "2023-09-01",
    uploads: 12,
    requests: 3,
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@university.edu",
    role: "admin",
    joinDate: "2023-08-15",
    uploads: 25,
    requests: 1,
  },
];

export default function AdminPage() {
  const [uploads, setUploads] = useState(mockUploads);
  const [requests, setRequests] = useState(mockRequests);
  const [users, setUsers] = useState(mockUsers);
  const [fulfillmentFile, setFulfillmentFile] = useState<File | null>(null);

  const handleApproveUpload = (id: string) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === id ? { ...upload, status: "approved" as const } : upload
      )
    );
    toast.success("Upload approved successfully");
  };

  const handleRejectUpload = (id: string) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === id ? { ...upload, status: "rejected" as const } : upload
      )
    );
    toast.success("Upload rejected");
  };

  const handleFulfillRequest = (id: string) => {
    if (!fulfillmentFile) {
      toast.error("Please select a file to fulfill the request");
      return;
    }

    setRequests((prev) =>
      prev.map((request) =>
        request.id === id
          ? { ...request, status: "fulfilled" as const }
          : request
      )
    );
    setFulfillmentFile(null);
    toast.success("Request fulfilled successfully");
  };

  const handleToggleUserRole = (id: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              role:
                user.role === "admin"
                  ? ("member" as const)
                  : ("admin" as const),
            }
          : user
      )
    );
    toast.success("User role updated");
  };

  const pendingUploads = uploads.filter(
    (upload) => upload.status === "pending"
  );
  const openRequests = requests.filter((request) => request.status === "open");

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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Uploads
              </CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingUploads.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Requests
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRequests.length}</div>
              <p className="text-xs text-muted-foreground">Need fulfillment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered members
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="uploads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="uploads">Pending Uploads</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads" className="space-y-4">
            {pendingUploads.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending uploads</p>
                </CardContent>
              </Card>
            ) : (
              pendingUploads.map((upload) => (
                <Card key={upload.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {upload.title}
                        </CardTitle>
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
                            Date:{" "}
                            {new Date(upload.uploadDate).toLocaleDateString()}
                          </span>
                          <span>Type: {upload.fileType}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
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
                          onClick={() => handleRejectUpload(upload.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveUpload(upload.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {openRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              openRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {request.request}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Requested by: {request.requester}</span>
                          <span>
                            Date:{" "}
                            {new Date(request.requestDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Upload className="h-4 w-4 mr-2" />
                            Fulfill
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
                              <Label htmlFor="fulfillment-file">
                                Upload File
                              </Label>
                              <Input
                                id="fulfillment-file"
                                type="file"
                                onChange={(e) =>
                                  setFulfillmentFile(
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                            </div>
                            <Button
                              onClick={() => handleFulfillRequest(request.id)}
                              disabled={!fulfillmentFile}
                              className="w-full"
                            >
                              Fulfill Request
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Uploads</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.joinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{user.uploads}</TableCell>
                        <TableCell>{user.requests}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleUserRole(user.id)}
                          >
                            {user.role === "admin" ? "Demote" : "Promote"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
