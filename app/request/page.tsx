"use client";

import type React from "react";
import { useState } from "react";
import {
  Send,
  TrendingUp,
  Upload,
  Calendar,
  User,
  FileText,
  File,
  Mail,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

interface PendingRequest {
  id: string;
  queryText: string;
  requesterId?: string;
  status: string;
  createdAt: string;
  courseName: string;
  courseYear: number;
  email: string[];
  program?: string;
  resourceType: string;
  school: string;
  tags: string[];
  fulfillUploadURL?: string;
  requesterName?: string;
}

interface RequestFormData {
  queryText: string;
  email: string;
  school: string;
  customSchool: string;
  program: string;
  courseYear: string;
  courseName: string;
  resourceType: string;
  tags: string[];
  notifyByEmail: boolean;
}

interface FulfillFormData {
  file: File | null;
  uploadAnonymously: boolean;
  notifyEmails: boolean;
}

interface NotificationFormData {
  email: string;
  requestId: string;
}

const schools = [
  { value: "SoCSE", label: "School of Computer Science & Engineering" },
  { value: "SDI", label: "School of Design & Innovation" },
  { value: "SoLAS", label: "School of Liberal Arts & Sciences" },
  { value: "SoB", label: "School of Business" },
  { value: "SoL", label: "School of Law" },
  { value: "Others", label: "Others" },
];

const socsePrograms = ["B.Tech", "BCA", "BSc"];
const resourceTypes = [
  "Past Papers",
  "Notes",
  "Slides",
  "Lab Manual",
  "Project",
  "Assignment",
  "Study Guide",
  "Other",
];
const courseYears = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
];

const popularRequests = [
  "Data Structures Final 2023",
  "Calculus III Integration Notes",
  "Operating Systems Lab Manual",
  "Database Design Project Examples",
  "Linear Algebra Midterm Solutions",
  "Computer Networks Past Papers",
  "Software Engineering Case Studies",
  "Statistics Formula Sheet",
];

export default function RequestPage() {
  const {user} = useUserProfile();
  const [activeTab, setActiveTab] = useState("browse");

  // Create Request Form State
  const [formData, setFormData] = useState<RequestFormData>({
    queryText: "",
    email: "",
    school: "",
    customSchool: "",
    program: "",
    courseYear: "",
    courseName: "",
    resourceType: "",
    tags: [],
    notifyByEmail: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fulfill Request State
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(
    null
  );
  const [fulfillData, setFulfillData] = useState<FulfillFormData>({
    file: null,
    uploadAnonymously: false,
    notifyEmails: true,
  });
  const [isFulfillDialogOpen, setIsFulfillDialogOpen] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [fulfillProgress, setFulfillProgress] = useState(0);

  // Notification State
  const [notificationData, setNotificationData] =
    useState<NotificationFormData>({
      email: "",
      requestId: "",
    });
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Fetch pending requests
  const {
    data: pendingRequests,
    error,
    mutate,
  } = useSWR<PendingRequest[]>("/api/request", fetcher);

  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.queryText.trim()) {
      toast.error("Please enter your request");
      return;
    }

    if (!formData.school) {
      toast.error("Please select your school");
      return;
    }

    if (formData.school === "Others" && !formData.customSchool.trim()) {
      toast.error("Please specify your school");
      return;
    }

    if (!formData.courseYear) {
      toast.error("Please select the course year");
      return;
    }

    if (!formData.courseName.trim()) {
      toast.error("Please enter the course name");
      return;
    }

    if (!formData.resourceType) {
      toast.error("Please select the resource type");
      return;
    }

    if (formData.notifyByEmail && !formData.email.trim()) {
      toast.error("Please enter your email for notifications");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queryText: formData.queryText,
          school:
            formData.school === "Others"
              ? formData.customSchool
              : formData.school,
          program: formData.program,
          courseYear: Number.parseInt(formData.courseYear.split(" ")[0]),
          courseName: formData.courseName,
          resourceType: formData.resourceType,
          tags: formData.tags,
          email: formData.notifyByEmail ? [formData.email] : [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      setFormData({
        queryText: "",
        email: "",
        school: "",
        customSchool: "",
        program: "",
        courseYear: "",
        courseName: "",
        resourceType: "",
        tags: [],
        notifyByEmail: false,
      });

      mutate(); // Refresh the requests list
      toast.success("Request submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRequest = (requestText: string) => {
    setFormData((prev) => ({ ...prev, queryText: requestText }));
    setActiveTab("create");
  };

  const handleFulfillRequest = (request: PendingRequest) => {
    setSelectedRequest(request);
    setIsFulfillDialogOpen(true);
  };

  const handleSubmitFulfillment = async () => {
    if (!fulfillData.file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!fulfillData.uploadAnonymously && !user) {
      toast.error("Please log in to upload with your profile");
      return;
    }

    setIsFulfilling(true);
    setFulfillProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", fulfillData.file);
      formDataToSend.append("requestId", selectedRequest!.id);
      formDataToSend.append(
        "uploadAnonymously",
        fulfillData.uploadAnonymously.toString()
      );
      formDataToSend.append(
        "notifyEmails",
        fulfillData.notifyEmails.toString()
      );

      // Simulate upload progress
      const interval = setInterval(() => {
        setFulfillProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/request/fulfill", {
        method: "POST",
        body: formDataToSend,
      });

      clearInterval(interval);
      setFulfillProgress(100);

      if (!response.ok) {
        throw new Error("Failed to fulfill request");
      }

      setTimeout(() => {
        setIsFulfillDialogOpen(false);
        setFulfillData({
          file: null,
          uploadAnonymously: false,
          notifyEmails: true,
        });
        setFulfillProgress(0);
        mutate(); // Refresh the requests list
        toast.success(
          "Request fulfilled successfully! Pending admin approval."
        );
      }, 500);
    } catch (error) {
      toast.error("Failed to fulfill request. Please try again.");
      setFulfillProgress(0);
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleSubscribeToNotifications = async () => {
    if (!notificationData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch("/api/request/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: notificationData.email,
          requestId: notificationData.requestId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe to notifications");
      }

      setIsNotificationDialogOpen(false);
      setNotificationData({ email: "", requestId: "" });
      toast.success("Successfully subscribed to notifications!");
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resource Requests</h1>
          <p className="text-muted-foreground">
            Browse pending requests, fulfill them by uploading resources, or
            create new requests.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Requests</TabsTrigger>
            <TabsTrigger value="create">Create Request</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Help the community by fulfilling these resource requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Failed to load requests. Please try again.
                    </p>
                  </div>
                ) : !pendingRequests ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-4 animate-pulse"
                      >
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No pending requests at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">
                              {request.queryText}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {request.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                <span className="font-medium">Course:</span>{" "}
                                {request.courseName}
                              </p>
                              <p>
                                <span className="font-medium">School:</span>{" "}
                                {request.school}
                              </p>
                              <p>
                                <span className="font-medium">Year:</span>{" "}
                                {request.courseYear}
                              </p>
                              <p>
                                <span className="font-medium">Type:</span>{" "}
                                {request.resourceType}
                              </p>
                              <p className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Requested on{" "}
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </p>
                              {request.fulfillUploadURL && (
                                <p className="flex items-center gap-1 text-green-600">
                                  <Upload className="h-3 w-3" />
                                  File uploaded - pending admin approval
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {request.fulfillUploadURL ? (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-300"
                              >
                                Fulfilled
                              </Badge>
                            ) : (
                              <Button
                                onClick={() => handleFulfillRequest(request)}
                                size="sm"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Fulfill
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNotificationData({
                                  email: "",
                                  requestId: request.id,
                                });
                                setIsNotificationDialogOpen(true);
                              }}
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              Notify Me
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            {/* Create Request Form */}
            <Card>
              <CardHeader>
                <CardTitle>Submit a Resource Request</CardTitle>
                <CardDescription>
                  Provide detailed information about the resource you need
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRequest} className="space-y-6">
                  {/* Query Text */}
                  <div className="space-y-2">
                    <Label htmlFor="queryText">
                      What are you looking for? *
                    </Label>
                    <Input
                      id="queryText"
                      placeholder="e.g., Machine Learning Final Exam 2023 with solutions"
                      value={formData.queryText}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          queryText: e.target.value,
                        }))
                      }
                      className="h-12"
                    />
                  </div>

                  {/* School */}
                  <div className="space-y-2">
                    <Label htmlFor="school">School *</Label>
                    <Select
                      value={formData.school}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, school: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.value} value={school.value}>
                            {school.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.school === "Others" && (
                      <Input
                        placeholder="Please specify your school"
                        value={formData.customSchool}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customSchool: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>

                  {/* Program */}
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    {formData.school === "SoCSE" ? (
                      <Select
                        value={formData.program}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, program: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your program" />
                        </SelectTrigger>
                        <SelectContent>
                          {socsePrograms.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter your program (e.g., MBA, LLB, etc.)"
                        value={formData.program}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            program: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>

                  {/* Course Year */}
                  <div className="space-y-2">
                    <Label htmlFor="courseYear">Course Year *</Label>
                    <Select
                      value={formData.courseYear}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, courseYear: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select the course year" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course Name */}
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name *</Label>
                    <Input
                      id="courseName"
                      placeholder="e.g., Data Structures, Object Oriented Programming with Java"
                      value={formData.courseName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          courseName: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Resource Type */}
                  <div className="space-y-2">
                    <Label htmlFor="resourceType">Resource Type *</Label>
                    <Select
                      value={formData.resourceType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          resourceType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of resource" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags (Optional)</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag(tagInput);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleAddTag(tagInput)}
                        >
                          Add
                        </Button>
                      </div>

                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="default"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleRemoveTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Notification */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyByEmail"
                        checked={formData.notifyByEmail}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            notifyByEmail: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="notifyByEmail">
                        Notify me by email when this request is fulfilled
                      </Label>
                    </div>

                    {formData.notifyByEmail && (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@university.edu"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Fulfill Request Dialog */}
        <Dialog
          open={isFulfillDialogOpen}
          onOpenChange={setIsFulfillDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Fulfill Request</DialogTitle>
              <DialogDescription>
                Upload a file to fulfill: "{selectedRequest?.queryText}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Upload Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uploadAnonymously"
                    checked={fulfillData.uploadAnonymously}
                    onCheckedChange={(checked) =>
                      setFulfillData((prev) => ({
                        ...prev,
                        uploadAnonymously: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="uploadAnonymously">Upload anonymously</Label>
                </div>

                {!fulfillData.uploadAnonymously && !user && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Authentication Required
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      You need to be logged in to upload with your profile.
                      Check "Upload anonymously" above or log in.
                    </p>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="fulfill-file">Upload File *</Label>
                <Input
                  id="fulfill-file"
                  type="file"
                  onChange={(e) =>
                    setFulfillData((prev) => ({
                      ...prev,
                      file: e.target.files?.[0] || null,
                    }))
                  }
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (Max 50MB)
                </p>
              </div>

              {/* Email Notification Option */}
              {selectedRequest?.email && selectedRequest.email.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifyEmails"
                      checked={fulfillData.notifyEmails}
                      onCheckedChange={(checked) =>
                        setFulfillData((prev) => ({
                          ...prev,
                          notifyEmails: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="notifyEmails">
                      Notify {selectedRequest.email.length} subscriber(s) when
                      fulfilled
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Subscribers will be notified that their requested resource
                    is now available.
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {isFulfilling && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{fulfillProgress}%</span>
                  </div>
                  <Progress value={fulfillProgress} />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFulfillDialogOpen(false)}
                disabled={isFulfilling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFulfillment}
                disabled={
                  !fulfillData.file ||
                  isFulfilling ||
                  (!fulfillData.uploadAnonymously && !user)
                }
              >
                {isFulfilling ? "Uploading..." : "Fulfill Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Subscription Dialog */}
        <Dialog
          open={isNotificationDialogOpen}
          onOpenChange={setIsNotificationDialogOpen}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Get Notified</DialogTitle>
              <DialogDescription>
                Enter your email to be notified when this request is fulfilled.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notification-email">Email Address</Label>
                <Input
                  id="notification-email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={notificationData.email}
                  onChange={(e) =>
                    setNotificationData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsNotificationDialogOpen(false)}
                disabled={isSubscribing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubscribeToNotifications}
                disabled={isSubscribing}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
