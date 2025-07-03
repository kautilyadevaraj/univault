"use client";

import type React from "react";
import { useState } from "react";
import { Upload, X, File, CheckCircle, User } from "lucide-react";
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
import { toast } from "sonner";
import Link from "next/link";

// Mock session hook - replace with actual useSession from your auth provider
function useSession() {
  // This should be replaced with your actual session hook
  return {
    data: null, // Set to user object when logged in
    status: "unauthenticated", // "loading" | "authenticated" | "unauthenticated"
  };
}

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

export default function UploadPage() {
  const { data: session, status } = useSession();
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
  });
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const suggestedTags = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Midterm",
    "Final",
    "Quiz",
    "Notes",
    "Past Papers",
    "Study Guide",
    "2024",
    "2023",
    "2022",
    "Semester 1",
    "Semester 2",
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in when not uploading anonymously
    if (!formData.uploadAnonymously && !session) {
      toast.error("Please log in to upload with your profile");
      return;
    }

    // Validate required fields
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
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsSuccess(true);
          toast.success(
            "Resource uploaded successfully! Pending admin approval."
          );
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  if (isSuccess) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
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
                      });
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Resource</h1>
          <p className="text-muted-foreground">
            Share your academic materials with the community. All uploads
            require admin approval.
          </p>
        </div>

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
                  <Label htmlFor="uploadAnonymously">Upload anonymously</Label>
                </div>

                {!formData.uploadAnonymously && !session && (
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

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Resource Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Object Oriented Programming Midterm 2023"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
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
                    setFormData((prev) => ({ ...prev, yearOfCreation: value }))
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
                    setFormData((prev) => ({ ...prev, resourceType: value }))
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

              {/* File Upload */}
              <div className="space-y-2">
                <Label>File Upload *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                      <span className="font-medium">{formData.file.name}</span>
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
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      />
                      <Button type="button" variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (Max 50MB)
                </p>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  isUploading ||
                  !formData.title ||
                  !formData.file ||
                  (!formData.uploadAnonymously && !session)
                }
              >
                {isUploading ? "Uploading..." : "Upload for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
