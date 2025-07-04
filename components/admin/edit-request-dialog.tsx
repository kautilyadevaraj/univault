"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { PendingRequest } from "./request-card";

interface EditRequestData {
  queryText: string;
  school: string;
  customSchool: string;
  program: string;
  yearOfCreation: string;
  courseYear: string;
  courseName: string;
  resourceType: string;
  tags: string[];
}

interface EditRequestDialogProps {
  request: PendingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: EditRequestData) => Promise<void>;
  actionLoading: string | null;
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

export function EditRequestDialog({
  request,
  isOpen,
  onClose,
  onUpdate,
  actionLoading,
}: EditRequestDialogProps) {
  const [editData, setEditData] = useState<EditRequestData>({
    queryText: "",
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

  // Initialize form data when request changes
  useState(() => {
    if (request) {
      setEditData({
        queryText: request.request,
        school: request.school || "",
        customSchool: "",
        program: request.program || "",
        yearOfCreation: request.yearOfCreation?.toString() || "",
        courseYear: request.courseYear || "",
        courseName: request.courseName || "",
        resourceType: request.resourceType || "",
        tags: request.tags || [],
      });
    }
  });

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
    await onUpdate(editData);
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
          <DialogDescription>Modify the request details</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Query Text */}
            <div className="md:col-span-2 space-y-2">
              <Label>What are you looking for? *</Label>
              <Input
                value={editData.queryText}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    queryText: e.target.value,
                  }))
                }
                placeholder="e.g., Machine Learning Final Exam 2023 with solutions"
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
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={actionLoading === `update-request-${request.id}`}
          >
            {actionLoading === `update-request-${request.id}` ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
