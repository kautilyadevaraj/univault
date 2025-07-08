"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PendingUpload } from "./upload-card";

interface EditUploadData {
  id: string;
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
}

interface EditUploadDialogProps {
  upload: PendingUpload | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: EditUploadData) => Promise<void>;
  actionLoading: string | null;
}

const schools = [
  { value: "SoCSE", label: "SoCSE" },
  { value: "SDI", label: "SDI" },
  { value: "SoLAS", label: "SoLAS" },
  { value: "SoB", label: "SoB" },
  { value: "SoL", label: "SoL" },
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

export function EditUploadDialog({
  upload,
  isOpen,
  onClose,
  onUpdate,
  actionLoading,
}: EditUploadDialogProps) {
  const [editData, setEditData] = useState<EditUploadData>({
    id: "",
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
  });
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when upload changes
  useEffect(() => {
    if (upload) {
      setEditData({
        id: upload.id,
        title: upload.title,
        description: upload.description,
        school: upload.school || "",
        customSchool: "",
        program: upload.program || "",
        yearOfCreation: upload.yearOfCreation?.toString() || "",
        courseYear: upload.courseYear || "",
        courseName: upload.courseName || "",
        resourceType: upload.resourceType || "",
        tags: upload.tags || [],
      });
    }
  }, [upload]);

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !editData.tags.includes(tag)) {
      setEditData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    console.log(editData)
    setIsSaving(true);
    try {
      await onUpdate(editData);
    } finally {
      setIsSaving(false);
    }
  };

  if (!upload) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Upload</DialogTitle>
          <DialogDescription>
            Make changes to the upload. Changes will be saved locally and
            applied when you approve the upload.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit-title">Resource Title *</Label>
              <Input
                id="edit-title"
                value={editData.title}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Object Oriented Programming Midterm 2023"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the resource content..."
                rows={3}
              />
            </div>

            {/* School */}
            <div className="space-y-2">
              <Label>School *</Label>
              <Select
                value={editData.school}
                onValueChange={(value) =>
                  setEditData((prev) => ({
                    ...prev,
                    school: value,
                    program: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.value} value={school.value}>
                      {school.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editData.school === "Others" && (
                <Input
                  placeholder="Please specify your school"
                  value={editData.customSchool}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      customSchool: e.target.value,
                    }))
                  }
                />
              )}
            </div>

            {/* Program */}
            <div className="space-y-2">
              <Label>Program</Label>
              {editData.school === "SoCSE" ? (
                <Select
                  value={editData.program}
                  onValueChange={(value) =>
                    setEditData((prev) => ({ ...prev, program: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
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
                  placeholder="Enter program (e.g., MBA, LLB, etc.)"
                  value={editData.program}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      program: e.target.value,
                    }))
                  }
                />
              )}
            </div>

            {/* Year of Creation */}
            <div className="space-y-2">
              <Label>Year of Creation *</Label>
              <Select
                value={editData.yearOfCreation}
                onValueChange={(value) =>
                  setEditData((prev) => ({ ...prev, yearOfCreation: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Year */}
            <div className="space-y-2">
              <Label>Course Year *</Label>
              <Select
                value={editData.courseYear}
                onValueChange={(value) =>
                  setEditData((prev) => ({ ...prev, courseYear: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course year" />
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
              <Label>Course Name *</Label>
              <Input
                value={editData.courseName}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    courseName: e.target.value,
                  }))
                }
                placeholder="e.g., Data Structures, Object Oriented Programming with Java"
              />
            </div>

            {/* Resource Type */}
            <div className="space-y-2">
              <Label>Resource Type *</Label>
              <Select
                value={editData.resourceType}
                onValueChange={(value) =>
                  setEditData((prev) => ({ ...prev, resourceType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource type" />
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
            <div className="md:col-span-2 space-y-2">
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
                {editData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editData.tags.map((tag) => (
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

            {/* File Upload */}
            <div className="md:col-span-2 space-y-2">
              <Label>Replace File (Optional)</Label>
              <Input
                type="file"
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    file: e.target.files?.[0],
                  }))
                }
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to keep the current file. Supported formats: PDF,
                DOC, DOCX, PPT, PPTX, TXT
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
