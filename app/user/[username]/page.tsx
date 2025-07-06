"use client";

import { useParams } from "next/navigation";
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
import {
  User,
  BookOpen,
  Calendar,
  GraduationCap,
  School,
  Mail,
  Lock,
  Globe,
  Users,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";

// API fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch user profile");
  }
  return res.json();
};

const schoolNames = {
  SoCSE: "School of Computer Science & Engineering",
  SDI: "School of Design & Innovation",
  SoLAS: "School of Liberal Arts & Sciences",
  SoB: "School of Business",
  SoL: "School of Law",
};

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  profileVisibility: string;
  bio?: string;
  profilePicture?: string;
  socialLinks: string[];
  school?: string;
  program?: string;
  yearOfStudy?: number;
  graduatingYear?: number;
  showEmail: boolean;
  showSchoolInfo: boolean;
  showGraduationYear: boolean;
  showResourceCount: boolean;
  showContributionScore: boolean;
  resourceCount?: number;
  contributionScore?: number;
  publicResources: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    createdAt: string;
    courseName: string;
    resourceType: string;
    tags: string[];
  }>;
}

function UserProfileSkeleton() {
  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 sm:h-9 w-32 sm:w-48 mb-2" />
              <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
            </div>
            <Skeleton className="h-9 sm:h-10 w-32 sm:w-40" />
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mb-1" />
                    <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const getErrorMessage = (errorMessage: string) => {
    switch (errorMessage) {
      case "User not found":
        return {
          title: "User not found",
          description: "The user you're looking for doesn't exist.",
        };
      case "Authentication required to view this profile":
        return {
          title: "Authentication Required",
          description: "This profile is only visible to logged-in users.",
        };
      case "This profile is only visible to members of the same school":
        return {
          title: "Access Restricted",
          description:
            "This profile is only visible to members of the same school.",
        };
      case "This profile is private":
        return {
          title: "Private Profile",
          description: "This user has set their profile to private.",
        };
      default:
        return {
          title: "Unable to Load Profile",
          description:
            "We couldn't load this user's profile. Please try again.",
        };
    }
  };

  const { title, description } = getErrorMessage(error.message);

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link href="/search">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Search
                </Link>
              </Button>
              <Button onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const {
    data: userProfile,
    error,
    isLoading,
    mutate,
  } = useSWR<UserProfile>(username ? `/api/user/${username}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
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

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return "Public Profile";
      case "SCHOOL_ONLY":
        return "School Members Only";
      case "PRIVATE":
        return "Private Profile";
      default:
        return "Public Profile";
    }
  };

  // Handle loading state
  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  // Handle error state
  if (error) {
    return <ErrorState error={error} onRetry={() => mutate()} />;
  }

  // Handle case where user data is not available
  if (!userProfile) {
    return (
      <ErrorState
        error={new Error("User data not available")}
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {userProfile.username}
              </h1>
              <div className="flex items-center gap-2">
                {getVisibilityIcon(userProfile.profileVisibility)}
                <p className="text-sm sm:text-base text-muted-foreground">
                  {getVisibilityText(userProfile.profileVisibility)}
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/search">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile.profilePicture && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={userProfile.profilePicture || "/placeholder.svg"}
                      alt={`${userProfile.username}'s profile`}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border"
                    />
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Username
                  </p>
                  <p className="text-base">{userProfile.username}</p>
                </div>

                {userProfile.showEmail && userProfile.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <p className="text-base break-all">{userProfile.email}</p>
                    </div>
                  </div>
                )}

                {userProfile.bio && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Bio
                      </p>
                      <p className="text-base">{userProfile.bio}</p>
                    </div>
                  </>
                )}

                {userProfile.showSchoolInfo && (
                  <>
                    <Separator />
                    {userProfile.school && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          School
                        </p>
                        <p className="text-base">
                          {schoolNames[
                            userProfile.school as keyof typeof schoolNames
                          ] || userProfile.school}
                        </p>
                      </div>
                    )}

                    {userProfile.program && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Program
                        </p>
                        <p className="text-base">{userProfile.program}</p>
                      </div>
                    )}

                    {userProfile.yearOfStudy && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Year of Study
                        </p>
                        <p className="text-base">
                          {userProfile.yearOfStudy}
                          {userProfile.yearOfStudy === 1
                            ? "st"
                            : userProfile.yearOfStudy === 2
                            ? "nd"
                            : userProfile.yearOfStudy === 3
                            ? "rd"
                            : "th"}{" "}
                          Year
                        </p>
                      </div>
                    )}

                    {userProfile.showGraduationYear &&
                      userProfile.graduatingYear && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Graduating Year
                          </p>
                          <p className="text-base">
                            {userProfile.graduatingYear}
                          </p>
                        </div>
                      )}
                  </>
                )}

                {userProfile.socialLinks &&
                  userProfile.socialLinks.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Social Links
                        </p>
                        <div className="space-y-2">
                          {userProfile.socialLinks.map(
                            (link: string, index: number) => (
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
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Member Since
                  </p>
                  <p className="text-base">
                    {new Date(userProfile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview & Resources */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            {(userProfile.showResourceCount ||
              userProfile.showContributionScore) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userProfile.showResourceCount && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Contributions
                      </CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {userProfile.resourceCount || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Resources shared
                      </p>
                    </CardContent>
                  </Card>
                )}

                {userProfile.showContributionScore && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Contribution Score
                      </CardTitle>
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {userProfile.contributionScore || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Points earned
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Public Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Public Contributions
                </CardTitle>
                <CardDescription>
                  Resources shared by {userProfile.username}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userProfile.publicResources &&
                userProfile.publicResources.length > 0 ? (
                  <div className="space-y-4">
                    {userProfile.publicResources.map((resource) => (
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
                            {resource.tags?.map((tag) => (
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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {userProfile.username} hasn't shared any public resources
                      yet
                    </p>
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
