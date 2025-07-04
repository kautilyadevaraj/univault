"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  BookOpen,
  Calendar,
  GraduationCap,
  School,
  Edit,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import type { Resource } from "@/lib/generated/prisma";

const schoolNames = {
  SoCSE: "School of Computer Science & Engineering",
  SDI: "School of Design & Innovation",
  SoLAS: "School of Liberal Arts & Sciences",
  SoB: "School of Business",
  SoL: "School of Law",
};

const schools = [
  { value: "SoCSE", label: "School of Computer Science & Engineering" },
  { value: "SDI", label: "School of Design & Innovation" },
  { value: "SoLAS", label: "School of Liberal Arts & Sciences" },
  { value: "SoB", label: "School of Business" },
  { value: "SoL", label: "School of Law" },
  { value: "Others", label: "Others" },
];

const socsePrograms = ["B.Tech", "BCA", "BSc"];

interface EditProfileData {
  username: string;
  school: string;
  program: string;
  yearOfStudy: number | null;
  graduatingYear: number | null;
}

export default function ProfilePage() {
  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR("/api/user/profile", fetcher);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<EditProfileData>({
    username: "",
    school: "",
    program: "",
    yearOfStudy: null,
    graduatingYear: null,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditProfile = () => {
    if (user) {
      setEditData({
        username: user.username || "",
        school: user.school || "",
        program: user.program || "",
        yearOfStudy: user.yearOfStudy || null,
        graduatingYear: user.graduatingYear || null,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await mutate(); // Refresh the data
      setIsEditDialogOpen(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const studyYears = [1, 2, 3, 4, 5];

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Information Skeleton */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            </div>

            {/* Activity Overview Skeleton */}
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-12 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-red-500 mb-4">
                <User className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Failed to load profile
                </h2>
                <p className="text-muted-foreground mb-4">
                  We couldn't load your profile information. Please try again.
                </p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const approvedResources = user.resources.filter(
    (r: Resource) => r.status === "APPROVED"
  );
  const pendingResources = user.resources.filter(
    (r: Resource) => r.status === "PENDING"
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and view your contributions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Information */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Username
                  </p>
                  <p className="text-base">{user.username || "Not set"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-base">{user.email}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    School
                  </p>
                  <p className="text-base">
                    {user.school
                      ? schoolNames[user.school as keyof typeof schoolNames] ||
                        user.school
                      : "Not specified"}
                  </p>
                </div>

                {(user.program || user.school) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Program
                    </p>
                    <p className="text-base">
                      {user.program || "Not specified"}
                    </p>
                  </div>
                )}

                {(user.yearOfStudy || user.graduatingYear) && (
                  <>
                    {user.yearOfStudy && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Year of Study
                        </p>
                        <p className="text-base">
                          {user.yearOfStudy}
                          {user.yearOfStudy === 1
                            ? "st"
                            : user.yearOfStudy === 2
                            ? "nd"
                            : user.yearOfStudy === 3
                            ? "rd"
                            : "th"}{" "}
                          Year
                        </p>
                      </div>
                    )}

                    {user.graduatingYear && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Graduating Year
                        </p>
                        <p className="text-base">{user.graduatingYear}</p>
                      </div>
                    )}
                  </>
                )}

                {(user.school ||
                  user.program ||
                  user.yearOfStudy ||
                  user.graduatingYear) && <Separator />}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Role
                  </p>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                </div>

                {(!user.school ||
                  !user.program ||
                  !user.yearOfStudy ||
                  !user.graduatingYear) && (
                  <>
                    <Separator />
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Complete Your Profile
                      </p>
                      <p className="text-xs text-blue-600">
                        Add missing information to help others find relevant
                        resources and connect with you.
                      </p>
                    </div>
                  </>
                )}

                <div className="pt-4">
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleEditProfile}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {!user.school ||
                        !user.program ||
                        !user.yearOfStudy ||
                        !user.graduatingYear
                          ? "Complete Profile"
                          : "Edit Profile"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Update your profile information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editData.username}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                username: e.target.value,
                              }))
                            }
                            placeholder="Enter your username"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="school">School</Label>
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
                              <SelectValue placeholder="Select your school" />
                            </SelectTrigger>
                            <SelectContent>
                              {schools.map((school) => (
                                <SelectItem
                                  key={school.value}
                                  value={school.value}
                                >
                                  {school.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="program">Program</Label>
                          {editData.school === "SoCSE" ? (
                            <Select
                              value={editData.program || "none"}
                              onValueChange={(value) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  program: value === "none" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your program" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Select a program
                                </SelectItem>
                                {socsePrograms.map((program) => (
                                  <SelectItem key={program} value={program}>
                                    {program}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : editData.school ? (
                            <Input
                              placeholder="Enter your program (e.g., MBA, LLB, etc.)"
                              value={editData.program}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  program: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <Input
                              placeholder="Select a school first"
                              disabled
                              value=""
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="yearOfStudy">Year of Study</Label>
                            <Select
                              value={editData.yearOfStudy?.toString() || "none"}
                              onValueChange={(value) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  yearOfStudy:
                                    value === "none"
                                      ? null
                                      : Number.parseInt(value),
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Not specified
                                </SelectItem>
                                {studyYears.map((year) => (
                                  <SelectItem
                                    key={year}
                                    value={year.toString()}
                                  >
                                    {year}
                                    {year === 1
                                      ? "st"
                                      : year === 2
                                      ? "nd"
                                      : year === 3
                                      ? "rd"
                                      : "th"}{" "}
                                    Year
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="graduatingYear">
                              Graduating Year
                            </Label>
                            <Select
                              value={
                                editData.graduatingYear?.toString() || "none"
                              }
                              onValueChange={(value) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  graduatingYear:
                                    value === "none"
                                      ? null
                                      : Number.parseInt(value),
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Not specified
                                </SelectItem>
                                {years.map((year) => (
                                  <SelectItem
                                    key={year}
                                    value={year.toString()}
                                  >
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isUpdating}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview & Resources */}
          <div className="md:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Uploads
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.resources.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {approvedResources.length} approved,{" "}
                    {pendingResources.length} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Contribution Score
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {approvedResources.length * 10}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Points earned from contributions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Your Uploads
                </CardTitle>
                <CardDescription>
                  Resources you've shared with the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.resources.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      You haven't uploaded any resources yet
                    </p>
                    <Button asChild>
                      <Link href="/upload">Upload Your First Resource</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.resources.map((resource: Resource) => (
                      <div key={resource.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{resource.title}</h3>
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <School className="h-3 w-3" />
                            {resource.courseName}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {resource.resourceType}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        asChild
                      >
                        <Link href="/upload">Upload Another Resource</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
