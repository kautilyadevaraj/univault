"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  Calendar,
  User,
  Eye,
  FileText,
  File,
  Filter,
  X,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  tags: string[];
  uploader: string;
  uploadDate: string;
  fileType: string;
  downloads: number;
  school: string;
  program: string;
  courseName: string;
  resourceType: string;
  yearOfCreation: number;
  courseYear: string;
  fileUrl: string;
  status: string;
  similarity?: number;
}

// Skeleton Components
function SearchResultSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
            <Skeleton className="h-10 flex-1 lg:w-24" />
            <Skeleton className="h-10 flex-1 lg:w-24" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [previewResource, setPreviewResource] = useState<SearchResult | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [downloadingResource, setDownloadingResource] = useState<string | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [useSmartSearch, setUseSmartSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Frontend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);

  // Improved debouncing with longer delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      // Reset to page 1 when search query changes
      setCurrentPage(1);
    }, 800); // Increased from 300ms to 800ms
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters, sortBy, useSmartSearch]);

  // Build search URL with parameters (keeping original simple format)
  const searchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    }
    if (useSmartSearch && debouncedQuery.trim()) {
      params.set("semantic", "true");
    }
    return `/api/search?${params.toString()}`;
  }, [debouncedQuery, useSmartSearch]);

  const {
    data: searchResults,
    error,
    isLoading,
    mutate,
  } = useSWR<SearchResult[]>(searchUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000, // Prevent duplicate requests within 1 second
  });

  // Set searching state based on SWR loading
  useEffect(() => {
    setIsSearching(isLoading);
  }, [isLoading]);

  const filterOptions = [
    "Past Papers",
    "2025",
    "2024",
    "Midterm",
    "SEE",
    "Notes",
    "CIE-1",
    "CIE-3",
    "Retest Papers"
  ];

  const courseYears = {
    "1": "1st Year",
    "2": "2nd Year",
    "3": "3rd Year",
    "4": "4th Year",
    "5": "5th Year",
  };

  // Filter and sort results (frontend processing)
  const filteredAndSortedResults = useMemo(() => {
    if (!searchResults) return [];

    let filtered = searchResults;

    // Apply selected filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter((result) =>
        selectedFilters.some(
          (filter) =>
            result.tags.some((tag) =>
              tag.toLowerCase().includes(filter.toLowerCase())
            ) ||
            result.resourceType.toLowerCase().includes(filter.toLowerCase()) ||
            result.yearOfCreation.toString().includes(filter)
        )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "date":
        filtered.sort(
          (a, b) =>
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
        break;
      case "downloads":
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "similarity":
        if (useSmartSearch) {
          filtered.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
        }
        break;
      default:
        // Keep original order for relevance
        break;
    }

    return filtered;
  }, [searchResults, selectedFilters, sortBy, useSmartSearch]);

  // Frontend pagination calculations
  const paginationData = useMemo(() => {
    const totalResults = filteredAndSortedResults.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const currentResults = filteredAndSortedResults.slice(startIndex, endIndex);

    return {
      currentResults,
      totalResults,
      totalPages,
      currentPage,
      resultsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startIndex: totalResults > 0 ? startIndex + 1 : 0,
      endIndex: Math.min(endIndex, totalResults),
    };
  }, [filteredAndSortedResults, currentPage, resultsPerPage]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setSearchQuery("");
    setDebouncedQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResultsPerPageChange = (value: string) => {
    setResultsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing results per page
  };

  async function handlePreview(resource: SearchResult) {
    setLoadingPreview(resource.id);
    setPreviewResource(resource);

    if (!previewUrls[resource.id]) {
      try {
        const res = await fetch(
          `/api/resource/download?key=${encodeURIComponent(resource.fileUrl)}`
        );
        if (!res.ok) throw new Error("Failed to get preview URL");
        const { url } = await res.json();
        setPreviewUrls((prev) => ({ ...prev, [resource.id]: url }));
      } catch (err) {
        console.error("Could not get preview URL", err);
        toast.error("Failed to load preview. Please try again.");
        setLoadingPreview(null);
        return;
      }
    }

    setLoadingPreview(null);
    setIsPreviewOpen(true);
  }

  async function handleDownload(resource: SearchResult) {
    setDownloadingResource(resource.id);

    try {
      let url = previewUrls[resource.id];
      if (!url) {
        const res = await fetch(
          `/api/resource/download?key=${encodeURIComponent(resource.fileUrl)}`
        );
        if (!res.ok) throw new Error("Failed to get download URL");
        const data = await res.json();
        url = data.url;
        setPreviewUrls((prev) => ({ ...prev, [resource.id]: url }));
      }

      window.open(url, "_blank");
      toast.success("Download started!");
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download resource. Please try again.");
    } finally {
      setDownloadingResource(null);
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleRefresh = () => {
    mutate();
    toast.success("Results refreshed!");
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const { totalPages, currentPage } = paginationData;
    if (totalPages <= 1) return [];

    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Show first few pages
        for (let i = 1; i <= 4; i++) {
          items.push(i);
        }
        items.push("ellipsis");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last few pages
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
        // Show middle pages
        items.push(1);
        items.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(i);
        }
        items.push("ellipsis");
        items.push(totalPages);
      }
    }

    return items;
  };

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle className="text-red-600 mb-4">
                Failed to load resources
              </CardTitle>
              <CardDescription className="mb-6">
                There was an error loading the search results. Please try again.
              </CardDescription>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Search Header - Always visible */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search for resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
                disabled={isSearching}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                  }}
                  disabled={isSearching}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-12 bg-transparent"
                onClick={() => setShowFilters(!showFilters)}
                disabled={isSearching}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {selectedFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedFilters.length}
                  </Badge>
                )}
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="lg"
                className="h-12 bg-transparent"
                disabled={isSearching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSearching ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Smart Search Toggle */}
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="smart-search"
              checked={useSmartSearch}
              onCheckedChange={setUseSmartSearch}
              disabled={isSearching}
            />
            <Label htmlFor="smart-search" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Smart Search (AI-powered semantic search)
            </Label>
            {useSmartSearch && (
              <Badge
                variant="outline"
                className="text-purple-600 border-purple-300"
              >
                AI
              </Badge>
            )}
          </div>

          {/* Filters */}
          {(showFilters || selectedFilters.length > 0) && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Filters</h3>
                {selectedFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    disabled={isSearching}
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <Badge
                    key={filter}
                    variant={
                      selectedFilters.includes(filter) ? "default" : "outline"
                    }
                    className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                      isSearching ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => !isSearching && toggleFilter(filter)}
                  >
                    {filter}
                    {selectedFilters.includes(filter) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sort Control and Results Per Page */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                {isSearching ? (
                  "Searching..."
                ) : paginationData.totalResults > 0 ? (
                  <>
                    Showing {paginationData.startIndex} to{" "}
                    {paginationData.endIndex} of {paginationData.totalResults}{" "}
                    results
                    {useSmartSearch && debouncedQuery && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-purple-600 border-purple-300"
                      >
                        AI Search
                      </Badge>
                    )}
                  </>
                ) : (
                  "No results found"
                )}
              </p>
              {(debouncedQuery || selectedFilters.length > 0) &&
                !isSearching && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear search
                  </Button>
                )}
            </div>
            <div className="flex gap-2">
              <Select
                value={resultsPerPage.toString()}
                onValueChange={handleResultsPerPageChange}
                disabled={isSearching}
              >
                <SelectTrigger className="">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={setSortBy}
                disabled={isSearching}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  {useSmartSearch && (
                    <SelectItem value="similarity">AI Similarity</SelectItem>
                  )}
                  <SelectItem value="date">Upload Date</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results - Only this section shows loading */}
        <div className="space-y-4 mb-8">
          {isSearching ? (
            // Loading skeletons - only for results
            Array.from({ length: resultsPerPage }).map((_, i) => (
              <SearchResultSkeleton key={i} />
            ))
          ) : paginationData.currentResults.length === 0 ? (
            // Empty state
            <Card className="text-center py-12">
              <CardHeader>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">No resources found</CardTitle>
                <CardDescription className="mb-4">
                  {debouncedQuery || selectedFilters.length > 0
                    ? useSmartSearch
                      ? "Try adjusting your search terms, disabling AI search, or clearing filters"
                      : "Try adjusting your search terms, enabling AI search, or clearing filters"
                    : "No resources are available at the moment"}
                </CardDescription>
                {(debouncedQuery || selectedFilters.length > 0) && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear search and filters
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setUseSmartSearch(!useSmartSearch)}
                    >
                      {useSmartSearch ? "Try Regular Search" : "Try AI Search"}
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>
          ) : (
            // Results - Show only current page results
            paginationData.currentResults.map((result) => (
              <Card
                key={result.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {result.title}
                        </CardTitle>
                        {useSmartSearch && result.similarity && (
                          <Badge
                            variant="outline"
                            className="text-purple-600 border-purple-300 text-xs"
                          >
                            {Math.round(result.similarity * 100)}% match
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base mb-3">
                        {result.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {result.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className={`text-xs cursor-pointer transition-colors ${
                              selectedFilters.includes(tag)
                                ? "bg-primary/20"
                                : ""
                            }`}
                            onClick={() => toggleFilter(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">{result.uploader}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.uploadDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          {getFileIcon(result.fileType)}
                          {result.fileType.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{result.school}</span> •{" "}
                        {result.courseName} •{" "}
                        {
                          courseYears[
                            result.courseYear as keyof typeof courseYears
                          ]
                        }
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => handlePreview(result)}
                        className="flex-1 lg:flex-none"
                        disabled={loadingPreview === result.id}
                      >
                        {loadingPreview === result.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        {loadingPreview === result.id
                          ? "Loading..."
                          : "Preview"}
                      </Button>
                      <Button
                        onClick={() => handleDownload(result)}
                        className="flex-1 lg:flex-none"
                        disabled={downloadingResource === result.id}
                      >
                        {downloadingResource === result.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {downloadingResource === result.id
                          ? "Downloading..."
                          : "Download"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] p-0 flex flex-col">
            <div className="flex-shrink-0 p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl mb-2 pr-8 text-start">
                  {previewResource?.title}
                </DialogTitle>
              </DialogHeader>
            </div>

            {previewResource && (
              <>
                <ScrollArea className="flex px-6 min-h-0">
                  <div className="space-y-4 pb-4">
                    {/* File Preview */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h3 className="text-lg font-semibold">File Preview</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getFileIcon(previewResource.fileType)}
                          <span className="truncate">
                            {previewResource.fileType} • Uploaded by{" "}
                            {previewResource.uploader}
                          </span>
                        </div>
                      </div>

                      {/* Preview Content */}
                      {(() => {
                        const url = previewUrls[previewResource.id];
                        if (!url) {
                          return (
                            <div className="p-8 text-center border rounded-lg">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                Loading preview...
                              </p>
                            </div>
                          );
                        }

                        if (previewResource.fileType.toLowerCase() === "pdf") {
                          return (
                            <iframe
                              src={url}
                              className="w-full h-64 sm:h-80 rounded-md border"
                              title="PDF Preview"
                            />
                          );
                        } else if (
                          ["png", "jpg", "jpeg", "gif", "webp"].includes(
                            previewResource.fileType.toLowerCase()
                          )
                        ) {
                          return (
                            <img
                              src={url || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-64 sm:h-80 object-contain rounded-md border"
                            />
                          );
                        } else {
                          return (
                            <div className="p-8 text-center border rounded-lg">
                              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground mb-4">
                                Preview not available for this file type.
                              </p>
                              <Button
                                onClick={() => window.open(url, "_blank")}
                              >
                                Open in new tab
                              </Button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </ScrollArea>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-2 p-6 pt-4 border-t bg-background">
                  <Button
                    variant="outline"
                    onClick={() => setIsPreviewOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Close Preview
                  </Button>
                  <Button
                    onClick={() => handleDownload(previewResource)}
                    className="w-full sm:w-auto"
                    disabled={downloadingResource === previewResource.id}
                  >
                    {downloadingResource === previewResource.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {downloadingResource === previewResource.id
                      ? "Downloading..."
                      : "Download Resource"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Frontend Pagination */}
        {!isSearching && paginationData.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (paginationData.hasPrevPage) {
                        handlePageChange(paginationData.currentPage - 1);
                      }
                    }}
                    className={
                      !paginationData.hasPrevPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {generatePaginationItems().map((item, index) => (
                  <PaginationItem key={index}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(item as number);
                        }}
                        isActive={item === paginationData.currentPage}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (paginationData.hasNextPage) {
                        handlePageChange(paginationData.currentPage + 1);
                      }
                    }}
                    className={
                      !paginationData.hasNextPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
