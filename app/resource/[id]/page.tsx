"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Calendar,
  FileText,
  File,
  School,
  BookOpen,
  Clock,
  Tag,
  Share2,
  Flag,
  Loader2,
  ExternalLink,
  GraduationCap,
  Building,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { UserLink } from "@/components/user-link";

interface DetailedResource {
  id: string;
  title: string;
  description: string;
  tags: string[];
  uploader: {
    id: string;
    username: string;
    email: string;
    school: string;
    program: string;
    graduatingYear: number | null;
    profilePicture: string | null;
    bio: string;
  };
  uploadDate: string;
  fileType: string;
  fileSize?: number;
  downloads: number;
  school: string;
  program: string;
  courseName: string;
  resourceType: string;
  yearOfCreation: number;
  courseYear: number;
  fileUrl: string;
  status: string;
  linkedRequestId: string | null;
}

function ResourceDetailSkeleton() {
  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resourceId = params.id as string;

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingResource, setDownloadingResource] = useState(false);

  const {
    data: resource,
    error,
    isLoading,
  } = useSWR<DetailedResource>(
    resourceId ? `/api/resource/${resourceId}` : null,
    fetcher
  );

  const courseYears = {
    1: "1st Year",
    2: "2nd Year",
    3: "3rd Year",
    4: "4th Year",
    5: "5th Year",
  };

  // Auto-load preview when resource is loaded
  useEffect(() => {
    const loadPreview = async () => {
      if (!resource || previewUrl || loadingPreview) return;

      setLoadingPreview(true);

      try {
        const res = await fetch(
          `/api/resource/download?key=${encodeURIComponent(resource.fileUrl)}`
        );
        if (!res.ok) throw new Error("Failed to get preview URL");
        const { url } = await res.json();
        setPreviewUrl(url);
      } catch (err) {
        console.error("Could not get preview URL", err);
        // Don't show error toast for auto-loading, just fail silently
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreview();
  }, [resource, previewUrl, loadingPreview]);

  const getFileIcon = (fileType: string) => {
    if (!fileType) return <File className="h-4 w-4" />;

    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleDownload = async () => {
    if (!resource) return;

    setDownloadingResource(true);

    try {
      let url = previewUrl;
      if (!url) {
        const res = await fetch(
          `/api/resource/download?key=${encodeURIComponent(resource.fileUrl)}`
        );
        if (!res.ok) throw new Error("Failed to get download URL");
        const data = await res.json();
        url = data.url;
      }

      if (url) {
        window.open(url, "_blank");
        toast.success("Download started!");
      } else {
        throw new Error("No download URL available");
      }
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download resource. Please try again.");
    } finally {
      setDownloadingResource(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleReport = () => {
    toast.info("Report functionality coming soon!");
  };

  const openFullPreview = () => {
    if (previewUrl) {
      setIsPreviewOpen(true);
    }
  };

  if (isLoading) {
    return <ResourceDetailSkeleton />;
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen py-4 sm:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle className="text-red-600 mb-4">
                Resource Not Found
              </CardTitle>
              <CardDescription className="mb-6">
                The resource you're looking for doesn't exist or has been
                removed.
              </CardDescription>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 p-2 sm:px-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Search</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                  {resource.title}
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg break-words mb-4">
                  {resource.description}
                </p>
              </div>
              <Button
                onClick={handleDownload}
                className="sm:ml-4 flex-shrink-0"
                disabled={downloadingResource}
                size="lg"
              >
                {downloadingResource ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloadingResource ? "Downloading..." : "Download"}
              </Button>
            </div>

            {/* Uploader and File Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="flex-shrink-0">
                  <AvatarImage
                    src={resource.uploader.profilePicture || undefined}
                  />
                  <AvatarFallback>
                    {resource.uploader.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <UserLink
                      username={resource.uploader.username}
                      className="font-medium underline text-black hover:text-black dark:text-white"
                      
                    />
                  </div>
                  {resource.uploader.bio && (
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      {resource.uploader.bio}
                    </p>
                  )}
                </div>
              </div>

              <Separator
                orientation="vertical"
                className="hidden sm:block h-12"
              />
              <Separator className="sm:hidden" />

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getFileIcon(resource.fileType)}
                  <span>{resource.fileType.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(resource.uploadDate).toLocaleDateString()}
                  </span>
                </div>
                <Badge
                  variant={
                    resource.status === "APPROVED" ? "default" : "secondary"
                  }
                >
                  {resource.status}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleShare} size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={handleReport} size="sm">
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
              {previewUrl && (
                <Button onClick={openFullPreview} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Full Screen Preview
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Single Column Content */}
        <div className="space-y-6">
          {/* Resource Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <BookOpen className="h-5 w-5" />
                Resource Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">School:</span>
                  <span className="truncate">{resource.school}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Program:</span>
                  <span className="truncate">{resource.program}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Course:</span>
                  <span className="truncate">{resource.courseName}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <School className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Year:</span>
                  <span className="truncate">
                    {courseYears[
                      resource.courseYear as keyof typeof courseYears
                    ] || `Year ${resource.courseYear}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Type:</span>
                  <Badge variant="secondary" className="truncate">
                    {resource.resourceType}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Created:</span>
                  <span className="truncate">{resource.yearOfCreation}</span>
                </div>
              </div>


              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {resource.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* File Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {getFileIcon(resource.fileType)}
                File Preview
              </CardTitle>
              <CardDescription>
                {resource.fileType.toUpperCase()} • Uploaded on{" "}
                {new Date(resource.uploadDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPreview ? (
                <div className="p-8 text-center border rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading preview...</p>
                </div>
              ) : previewUrl ? (
                <div className="space-y-4">
                  {resource.fileType.toLowerCase() === "pdf" ? (
                    <div className="relative">
                      <iframe
                        src={previewUrl}
                        className="w-full h-64 sm:h-96 rounded-md border"
                        title="PDF Preview"
                      />
                      <Button
                        onClick={openFullPreview}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Full Screen
                      </Button>
                    </div>
                  ) : ["png", "jpg", "jpeg", "gif", "webp"].includes(
                      resource.fileType.toLowerCase()
                    ) ? (
                    <div className="relative">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-64 sm:h-96 object-contain rounded-md border cursor-pointer"
                        onClick={openFullPreview}
                      />
                      <Button
                        onClick={openFullPreview}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Full Screen
                      </Button>
                    </div>
                  ) : (
                    <div className="p-8 text-center border rounded-lg">
                      <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Preview not available for this file type.
                      </p>
                      <Button
                        onClick={() =>
                          previewUrl && window.open(previewUrl, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in new tab
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-lg">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Preview could not be loaded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full Screen Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[90vh] p-0 flex flex-col">
            <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl mb-2 pr-8 text-start break-words">
                  {resource.title}
                </DialogTitle>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 px-4 sm:px-6">
              <div>
                {previewUrl ? (
                  <>
                    {resource.fileType.toLowerCase() === "pdf" ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-[70vh] rounded-md border"
                        title="PDF Preview"
                      />
                    ) : ["png", "jpg", "jpeg", "gif", "webp"].includes(
                        resource.fileType.toLowerCase()
                      ) ? (
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full max-h-[70vh] object-contain rounded-md border"
                      />
                    ) : (
                      <div className="p-8 text-center border rounded-lg">
                        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          Preview not available for this file type.
                        </p>
                        <Button
                          onClick={() =>
                            previewUrl && window.open(previewUrl, "_blank")
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in new tab
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center border rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading preview...</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex-shrink-0 flex sm:flex-row justify-end gap-2 p-4 sm:p-6 pt-4 border-t bg-background">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="sm:w-auto"
              >
                Close Preview
              </Button>
              <Button
                onClick={handleDownload}
                className="sm:w-auto"
                disabled={downloadingResource}
              >
                {downloadingResource ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloadingResource ? "Downloading..." : "Download Resource"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
