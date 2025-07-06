"use client";

import { useState, useEffect } from "react";
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

interface FulfillRequestData {
  title: string;
  description?: string;
  school: string;
  customSchool: string;
  program: string;
  yearOfCreation: string;
  courseYear: string;
  courseName: string;
  resourceType: string;
  tags: string[];
}

interface FulfillRequestDialogProps {
  request: PendingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onFulfill: (data: FormData) => Promise<void>;
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
const courseYears = [1, 2, 3, 4, 5];

export function FulfillRequestDialog({
  request,
  isOpen,
  onClose,
  onFulfill,
  actionLoading,
}: FulfillRequestDialogProps) {
  const [editData, setEditData] = useState<FulfillRequestData>({
    title: "",
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
  const [file, setFile] = useState<File | null>(null);

  // Initialize form data when request changes
  useEffect(() => {
    if (!request) return;
    console.log(request)
    setEditData({
      title: request.request,
      school: request.school || "",
      customSchool: "",
      program: request.program || "",
      yearOfCreation: request.yearOfCreation?.toString() || "",
      courseYear: request.courseYear || "",
      courseName: request.courseName || "",
      resourceType: request.resourceType || "",
      tags: request.tags || [],
    });
    setFile(null);
  }, [request]);

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
    if (!file) return; // must upload something
    const f = new FormData();
    // server expects “title”, so we map queryText → title
    f.append("title", editData.title);
    f.append("description", editData.description || "");
    f.append(
      "school",
      editData.school === "Others" ? editData.customSchool : editData.school
    );
    f.append("program", editData.program);
    f.append("yearOfCreation", editData.yearOfCreation);
    f.append("courseYear", editData.courseYear); // numeric string “1”-“5”
    f.append("courseName", editData.courseName);
    f.append("resourceType", editData.resourceType);
    f.append("tags", JSON.stringify(editData.tags));
    f.append("file", file);
    await onFulfill(f);
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fulfill Request</DialogTitle>
          <DialogDescription>
            {" "}
            Update any incorrect details and upload the file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resource Name */}
            <div className="md:col-span-2 space-y-2">
              <Label>Name of the Resource</Label>
              <Input
                value={editData.title}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g., Machine Learning Final Exam 2025 Papers"
              />
            </div>

            {/* Resource Description */}
            <div className="md:col-span-2 space-y-2">
              <Label>Description of the Resource</Label>
              <Input
                value={editData.description || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Give a brief description of the resource"
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
            {/* <div className="space-y-2">
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
            </div> */}

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

            {/* Fulfillment File */}
            <div className="space-y-2">
              <Label>Fulfilment file *</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={actionLoading === `fulfill-${request.id}`}
          >
            {actionLoading === `fulfill-${request?.id}` && (
              <Loader2 className="mr-2 animate-spin" />
            )}
            {request?.fulfillUploadURL
              ? "Replace file & Save"
              : "Upload & Fulfill"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
