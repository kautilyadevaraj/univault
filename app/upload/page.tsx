"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Upload,
  X,
  File,
  CheckCircle,
  User,
  Search,
  LinkIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

interface UploadFormData {
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
  file: File | null;
  uploadAnonymously: boolean;
  linkedRequestId: string | null;
  email: string;
  notifyByEmail: boolean;
}

interface PendingRequest {
  id: string;
  queryText: string;
  school: string;
  program?: string | null;
  yearOfCreation?: number | null;
  courseYear: number;
  courseName: string;
  resourceType: string;
  createdAt: string;
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

interface NotificationFormData {
  email: string;
  resourceId: string;
}

export default function UploadPage() {
  const { user, loading } = useUserProfile();
  const [formData, setFormData] = useState<UploadFormData>({
    title: "",
    description: "",
    school: "",
    customSchool: "",
    program: "",
    yearOfCreation: "",
    courseYear: "",
    courseName: "",
    resourceType: "",
    tags: [],
    file: null,
    uploadAnonymously: false,
    linkedRequestId: null,
    notifyByEmail: false,
    email: "",
  });
  console.log(formData)
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [linkType, setLinkType] = useState<"none" | "existing">("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isReqLoading, setIsReqLoading] = useState(true);
  const [reqError, setReqError] = useState<string | null>(null);
  // Notification State
    const [notificationData, setNotificationData] = useState<NotificationFormData>({
        email: "",
        resourceId: "",
      });

  useEffect(() => {
    async function loadPendingRequests() {
      try {
        setIsReqLoading(true);
        const res = await fetch("/api/request");
        if (!res.ok) throw new Error("Failed to load requests");
        const data: PendingRequest[] = await res.json();

        setRequests(data);
      } catch (err: any) {
        setReqError(err.message ?? "Unknown error");
        toast.error("Unable to load requests right now");
      } finally {
        setIsReqLoading(false);
      }
    }

    loadPendingRequests();
  }, []);

  const suggestedTags = [
    "Midterm",
    "Final",
    "Quiz",
    "Notes",
    "Past Papers",
    "Study Guide",
    "2025",
    "2024",
  ];

  const filteredRequests = searchQuery
    ? requests.filter(
        (req) =>
          req.queryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : requests;

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

  const handleFileSelect = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB - Temp fix.

    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB limit. Choose a smaller file.");
      return;
    }
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleLinkRequest = (requestId: string) => {
    const selectedRequest = requests.find((req) => req.id === requestId);
    if (!selectedRequest) return;

    setFormData((prev) => ({
      ...prev,
      linkedRequestId: requestId,
      school: selectedRequest.school,
      program: selectedRequest.program ?? "",
      yearOfCreation: (
        selectedRequest.yearOfCreation ?? currentYear
      ).toString(),
      courseYear: `${selectedRequest.courseYear}th Year`, // map 1 → "1st Year" if you keep human text
      courseName: selectedRequest.courseName,
      resourceType: selectedRequest.resourceType,
      title: selectedRequest.queryText,
    }));

    setIsRequestDialogOpen(false);
    toast.success(
      "Request linked successfully! Form fields have been pre-filled."
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Authentication check
    if (!formData.uploadAnonymously && !user) {
      toast.error("Please log in to upload with your profile");
      return;
    }

    // Required fields
    if (
      !formData.title ||
      !formData.file ||
      !formData.school ||
      !formData.yearOfCreation ||
      !formData.courseYear ||
      !formData.courseName ||
      !formData.resourceType
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.school === "Others" && !formData.customSchool.trim()) {
      toast.error("Please specify your school");
      return;
    }

    setIsUploading(true);
    toast.loading("Uploading resource…");

    // 1. Build FormData
    const payload = new FormData();
    payload.append("title", formData.title);
    if (formData.description)
      payload.append("description", formData.description);
    payload.append(
      "school",
      formData.school === "Others" ? formData.customSchool : formData.school
    );
    if (formData.program) payload.append("program", formData.program);
    payload.append("yearOfCreation", formData.yearOfCreation);
    // courseYear must be an integer string
    payload.append("courseYear", formData.courseYear);
    payload.append("courseName", formData.courseName);
    payload.append("resourceType", formData.resourceType);

    // tags: stringify so server can JSON.parse
    if (formData.tags.length > 0) {
      payload.append("tags", JSON.stringify(formData.tags));
    } else {
      payload.append("tags", JSON.stringify([]));
    }

    // optional: link to request
    if (formData.linkedRequestId) {
      payload.append("linkedRequestId", formData.linkedRequestId);
    }
    if (formData.email) {
      payload.append("email", formData.email);
    }

    // the file itself
    payload.append("file", formData.file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      setIsUploading(false);
      toast.dismiss();

      if (res.ok) {
        toast.success("Uploaded! Pending admin approval.");
        setIsSuccess(true);
        // you now have `data` as the newly created Resource object
        console.log("Resource created:", data);
      } else {
        toast.error(data.error || "Upload failed");
        console.error("Upload error:", data);
      }
    } catch (err) {
      setIsUploading(false);
      toast.dismiss();
      toast.error("Network error during upload");
      console.error("Fetch error:", err);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const getLinkedRequestDetails = () => {
    if (!formData.linkedRequestId) return null;
    return requests.find((req) => req.id === formData.linkedRequestId);
  };

  const linkedRequest = getLinkedRequestDetails();

  if (isSuccess) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Upload Successful!</CardTitle>
              <CardDescription className="text-base">
                Your resource has been submitted and is pending admin approval.
                You'll be notified once it's available to the community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg text-left">
                  <h3 className="font-semibold mb-2">Submitted Resource:</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formData.title}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formData.school === "Others"
                      ? formData.customSchool
                      : formData.school}{" "}
                    - {formData.courseName}
                  </p>
                  {formData.linkedRequestId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <LinkIcon className="h-3 w-3" />
                      <span>Linked to request: {linkedRequest?.queryText}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({
                        title: "",
                        description: "",
                        school: "",
                        customSchool: "",
                        program: "",
                        yearOfCreation: "",
                        courseYear: "",
                        courseName: "",
                        resourceType: "",
                        tags: [],
                        file: null,
                        uploadAnonymously: false,
                        linkedRequestId: null,
                        notifyByEmail: false,
                        email: ""
                      });
                      setLinkType("none");
                    }}
                  >
                    Upload Another
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Resource</h1>
          <p className="text-muted-foreground">
            Share your academic materials with the community. All uploads
            require admin approval.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Details</CardTitle>
                <CardDescription>
                  Provide information about the resource you're sharing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Upload Type Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="uploadAnonymously"
                        checked={formData.uploadAnonymously}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            uploadAnonymously: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="uploadAnonymously">
                        Upload anonymously
                      </Label>
                    </div>

                    {!formData.uploadAnonymously && !user && !loading && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Authentication Required
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          You need to be logged in to upload with your profile.{" "}
                          <Link
                            href="/login"
                            className="underline hover:no-underline"
                          >
                            Login here
                          </Link>{" "}
                          or check "Upload anonymously" above.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Link to Request */}
                  <div className="space-y-4">
                    <Label>Link to Request</Label>
                    <RadioGroup
                      value={linkType}
                      onValueChange={(value) => {
                        setLinkType(value as "none" | "existing");
                        if (value === "none") {
                          setFormData((prev) => ({
                            ...prev,
                            linkedRequestId: null,
                          }));
                        }
                      }}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none">
                          Upload without linking to a request
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing" />
                        <Label htmlFor="existing">
                          Link to an existing request
                        </Label>
                      </div>
                    </RadioGroup>

                    {linkType === "existing" && (
                      <div className="pl-6 border-l-2 border-muted">
                        <Dialog
                          open={isRequestDialogOpen}
                          onOpenChange={setIsRequestDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full flex justify-between items-center bg-transparent"
                            >
                              <span>
                                {formData.linkedRequestId
                                  ? `Linked: ${
                                      requests.find(
                                        (req) =>
                                          req.id === formData.linkedRequestId
                                      )?.queryText
                                    }`
                                  : "Select a request"}
                              </span>
                              <Search className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>
                                Link to an Existing Request
                              </DialogTitle>
                              <DialogDescription>
                                Search and select a request that your upload
                                fulfills
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Search requests..."
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                />
                              </div>
                              <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {filteredRequests.length === 0 ? (
                                  <p className="text-center text-muted-foreground py-4">
                                    No matching requests found
                                  </p>
                                ) : (
                                  filteredRequests.map((request) => (
                                    <div
                                      key={request.id}
                                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                                        formData.linkedRequestId === request.id
                                          ? "border-primary bg-primary/5"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        handleLinkRequest(request.id)
                                      }
                                    >
                                      <div className="font-medium">
                                        {request.queryText}
                                      </div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {request.school} • {request.courseName}{" "}
                                        • {request.resourceType}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Requested on{" "}
                                        {new Date(
                                          request.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {formData.linkedRequestId && (
                          <div className="mt-2 p-3 border rounded-lg bg-muted/30">
                            <div className="flex justify-between">
                              <div className="font-medium">
                                {linkedRequest?.queryText}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    linkedRequestId: null,
                                  }))
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {linkedRequest?.school} •{" "}
                              {linkedRequest?.courseName} •{" "}
                              {linkedRequest?.resourceType}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Upload File *</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {formData.file ? (
                        <div className="flex items-center justify-center gap-2">
                          <File className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {formData.file.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, file: null }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground mb-2">
                            Drag and drop your file here, or click to browse
                          </p>
                          <input
                            type="file"
                            className="hidden"
                            id="file-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(file);
                            }}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                          />
                          <Button type="button" variant="outline" asChild>
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer"
                            >
                              Choose File
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP (Max
                      5MB)
                    </p>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Resource Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Object Oriented Programming Midterm 2023"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the resource content..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
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

                    {/* Year of Creation */}
                    <div className="space-y-2">
                      <Label htmlFor="yearOfCreation">Year of Creation *</Label>
                      <Select
                        value={formData.yearOfCreation}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            yearOfCreation: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select the year the resource was created" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Course Year */}
                    <div className="space-y-2">
                      <Label htmlFor="courseYear">Course Year *</Label>
                      <Select
                        value={formData.courseYear}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            courseYear: value,
                          }))
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
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
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

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Suggested tags:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags
                            .filter((tag) => !formData.tags.includes(tag))
                            .slice(0, 10)
                            .map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => handleAddTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      </div>
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
                        Notify me by email when this resource is approved.
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={
                      isUploading ||
                      !formData.title ||
                      !formData.file ||
                      (!formData.uploadAnonymously && !user)
                    }
                  >
                    {isUploading ? "Uploading..." : "Upload for Approval"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
