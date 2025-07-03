"use client";

import type React from "react";
import { useState } from "react";
import { Send, TrendingUp } from "lucide-react";
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
import { X } from "lucide-react";
import { toast } from "sonner";

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
  "Data Structures and Algorithms Final 2023",
  "Calculus Notes",
  "Operating Systems Lab Manual",
  "Linear Algebra Midterm Solutions",
  "Computer Networks Past Papers",
];

export default function RequestPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    const payload = {
      ...formData,
      school:
        formData.school === "Others" ? formData.customSchool : formData.school,
    };

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Submission failed.");
        return;
      }

      toast.success("Request submitted successfully!");
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
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRequest = (requestText: string) => {
    setFormData((prev) => ({ ...prev, queryText: requestText }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Request Resources</h1>
          <p className="text-muted-foreground">
            Can't find what you're looking for? Request specific materials and
            get notified when they're available.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit a Resource Request</CardTitle>
            <CardDescription>
              Provide detailed information about the resource you need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Query Text */}
              <div className="space-y-2">
                <Label htmlFor="queryText">What are you looking for? *</Label>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Requests
            </CardTitle>
            <CardDescription>
              Click on any of these popular requests to quickly fill the form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {popularRequests.map((popularRequest, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm">{popularRequest}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickRequest(popularRequest)}
                  >
                    Use This
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
