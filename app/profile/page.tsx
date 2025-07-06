"use client";

import { useState } from "react";
import useSWR from "swr";
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
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  UserIcon,
  BookOpen,
  Calendar,
  GraduationCap,
  School,
  Edit,
  Save,
  X,
  Lock,
  Globe,
  Users,
  Mail,
  Plus,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// API fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
};

// API endpoints
const API_ENDPOINTS = {
  profile: "/api/user/profile",
  updateProfile: "/api/user/profile",
  updatePrivacy: "/api/user/privacy",
};

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
  bio: string;
  socialLinks: string[];
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  school?: string;
  program?: string;
  yearOfStudy?: number;
  graduatingYear?: number;
  bio?: string;
  profilePicture?: string;
  socialLinks?: string[];
  profileVisibility: string;
  showEmail: boolean;
  showSchoolInfo: boolean;
  showGraduationYear: boolean;
  showResourceCount: boolean;
  showContributionScore: boolean;
  resources: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    courseName: string;
    resourceType: string;
    tags: string[];
  }>;
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 sm:h-9 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-4 sm:h-5 w-64 sm:w-96" />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Profile Information Skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mb-1" />
                    <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                  </div>
                ))}
                <Skeleton className="h-9 sm:h-10 w-full mt-4" />
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview Skeleton */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Skeleton className="h-3 sm:h-4 w-3 sm:w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 sm:h-8 w-8 sm:w-12 mb-1" />
                    <Skeleton className="h-3 w-24 sm:w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <Skeleton className="h-4 sm:h-5 w-32 sm:w-48" />
                        <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                        <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                        <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
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

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Unable to Load Profile</CardTitle>
            <CardDescription>
              We couldn't load your profile information. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message ||
                "Something went wrong while loading your profile."}
            </p>
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<UserProfile>(API_ENDPOINTS.profile, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<EditProfileData>({
    username: user?.username || "",
    school: user?.school || "",
    program: user?.program || "",
    yearOfStudy: user?.yearOfStudy || null,
    graduatingYear: user?.graduatingYear || null,
    bio: user?.bio || "",
    socialLinks: user?.socialLinks || [],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return <Globe className="h-4 w-4 text-green-600" />;
      case "SCHOOL_ONLY":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "PRIVATE":
        return <Lock className="h-4 w-4 text-red-600" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const handleEditProfile = () => {
    if (!user) return;

    setEditData({
      username: user.username,
      school: user.school || "",
      program: user.program || "",
      yearOfStudy: user.yearOfStudy || null,
      graduatingYear: user.graduatingYear || null,
      bio: user.bio || "",
      socialLinks: user.socialLinks || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const response = await fetch(API_ENDPOINTS.updateProfile, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update the SWR cache with the new data
      mutate({ ...user, ...updatedUser }, false);

      setIsEditDialogOpen(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrivacyUpdate = async (field: string, value: any) => {
    if (!user) return;

    // Store the original value for potential rollback
    const originalValue = user[field as keyof UserProfile];

    // Optimistically update the UI immediately
    const optimisticUpdate = { ...user, [field]: value };
    mutate(optimisticUpdate, false);

    try {
      const response = await fetch(API_ENDPOINTS.updatePrivacy, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        mutate({ ...user, [field]: originalValue }, false);
        throw new Error("Failed to update privacy settings");
      }

      // Don't overwrite with server response - keep the optimistic update
      // The server call succeeded, so our optimistic update is correct
      toast.success("Privacy settings updated!");
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      toast.error("Failed to update privacy settings. Please try again.");

      // Revert the optimistic update on error
      mutate({ ...user, [field]: originalValue }, false);
    }
  };

  const addSocialLink = () => {
    setEditData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ""],
    }));
  };

  const updateSocialLink = (index: number, value: string) => {
    setEditData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) =>
        i === index ? value : link
      ),
    }));
  };

  const removeSocialLink = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const studyYears = [1, 2, 3, 4, 5];

  // Handle loading state
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Handle error state
  if (error) {
    return <ErrorState error={error} onRetry={() => mutate()} />;
  }

  // Handle case where user data is not available
  if (!user) {
    return (
      <ErrorState
        error={new Error("User data not available")}
        onRetry={() => mutate()}
      />
    );
  }

  const approvedResources = user.resources.filter(
    (r) => r.status === "APPROVED"
  );
  const pendingResources = user.resources.filter((r) => r.status === "PENDING");

  const isProfileIncomplete =
    !user.school || !user.program || !user.yearOfStudy || !user.graduatingYear;

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Your Profile
              </h1>
              <div className="flex items-center gap-2">
                {getVisibilityIcon(user.profileVisibility)}
                <p className="text-sm sm:text-base text-muted-foreground">
                  {user.profileVisibility === "PUBLIC"
                    ? "Public Profile"
                    : user.profileVisibility === "SCHOOL_ONLY"
                    ? "School Members Only"
                    : "Private Profile"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPrivacyDialogOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
              <Button asChild>
                <Link href={`/user/${user.username}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Profile
                </Link>
              </Button>
            </div>
          </div>

          {isProfileIncomplete && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Complete Your Profile
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                    Add missing information to help others find relevant
                    resources and connect with you.
                  </p>
                  <Button size="sm" onClick={handleEditProfile}>
                    Complete Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.profilePicture && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={user.profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border"
                    />
                  </div>
                )}

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
                  <p className="text-base break-all">{user.email}</p>
                </div>

                {user.bio && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Bio
                      </p>
                      <p className="text-base">{user.bio}</p>
                    </div>
                  </>
                )}

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

                {user.program && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Program
                    </p>
                    <p className="text-base">
                      {user.program || "Not specified"}
                    </p>
                  </div>
                )}

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

                {user.socialLinks && user.socialLinks.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Social Links
                      </p>
                      <div className="space-y-2">
                        {user.socialLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm break-all"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

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

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Member Since
                  </p>
                  <p className="text-base">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleEditProfile}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview & Resources */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {user.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="border rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <h3 className="font-medium">{resource.title}</h3>
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <School className="h-3 w-3" />
                            {resource.courseName}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {resource.resourceType}
                            </Badge>
                            {resource.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
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

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information and social links
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
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell others about yourself..."
                  rows={3}
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
                      <SelectItem key={school.value} value={school.value}>
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
                      <SelectItem value="none">Select a program</SelectItem>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearOfStudy">Year of Study</Label>
                  <Select
                    value={editData.yearOfStudy?.toString() || "none"}
                    onValueChange={(value) =>
                      setEditData((prev) => ({
                        ...prev,
                        yearOfStudy:
                          value === "none" ? null : Number.parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {studyYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
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
                  <Label htmlFor="graduatingYear">Graduating Year</Label>
                  <Select
                    value={editData.graduatingYear?.toString() || "none"}
                    onValueChange={(value) =>
                      setEditData((prev) => ({
                        ...prev,
                        graduatingYear:
                          value === "none" ? null : Number.parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Social Links</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialLink}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Link
                  </Button>
                </div>
                <div className="space-y-2">
                  {editData.socialLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={link}
                        onChange={(e) =>
                          updateSocialLink(index, e.target.value)
                        }
                        placeholder="https://..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSocialLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Settings Dialog */}
        <Dialog
          open={isPrivacyDialogOpen}
          onOpenChange={setIsPrivacyDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy Settings
              </DialogTitle>
              <DialogDescription>
                Control who can see your profile and what information is visible
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">
                  Profile Visibility
                </Label>
                <Select
                  value={user.profileVisibility}
                  onValueChange={(value) =>
                    handlePrivacyUpdate("profileVisibility", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        Public - Anyone can view
                      </div>
                    </SelectItem>
                    <SelectItem value="SCHOOL_ONLY">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        School Only - Same school members
                      </div>
                    </SelectItem>
                    <SelectItem value="PRIVATE">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-600" />
                        Private - Only you can view
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Visible Information
                </Label>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Show email address</span>
                  </div>
                  <Switch
                    checked={user.showEmail}
                    onCheckedChange={(checked) =>
                      handlePrivacyUpdate("showEmail", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    <span className="text-sm">Show school information</span>
                  </div>
                  <Switch
                    checked={user.showSchoolInfo}
                    onCheckedChange={(checked) =>
                      handlePrivacyUpdate("showSchoolInfo", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-sm">Show graduation year</span>
                  </div>
                  <Switch
                    checked={user.showGraduationYear}
                    onCheckedChange={(checked) =>
                      handlePrivacyUpdate("showGraduationYear", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">Show resource count</span>
                  </div>
                  <Switch
                    checked={user.showResourceCount}
                    onCheckedChange={(checked) =>
                      handlePrivacyUpdate("showResourceCount", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-sm">Show contribution score</span>
                  </div>
                  <Switch
                    checked={user.showContributionScore}
                    onCheckedChange={(checked) =>
                      handlePrivacyUpdate("showContributionScore", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
