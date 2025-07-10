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
  ExternalLink,
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
import { UserLink } from "@/components/user-link";
import Link from "next/link";

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
          <div className="flex flex-col gap-2 lg:w-auto w-full">
            <Skeleton className="h-10 w-full lg:w-24" />
            <Skeleton className="h-10 w-full lg:w-24" />
            <Skeleton className="h-10 w-full lg:w-24" />
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
  const [selectedFilters, setSelectedFilters] = useState<{
    tags: string[];
    schools: string[];
    programs: string[];
    resourceTypes: string[];
    fileTypes: string[];
    courseYears: string[];
  }>({
    tags: [],
    schools: [],
    programs: [],
    resourceTypes: [],
    fileTypes: [],
    courseYears: [],
  });
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
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters, sortBy, useSmartSearch]);

  // Build search URL with parameters
  const searchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    }
    if (useSmartSearch && debouncedQuery.trim()) {
      params.set("semantic", "true");
    }
    // Always include sort parameter
    params.set("sort", sortBy);
    return `/api/search?${params.toString()}`;
  }, [debouncedQuery, useSmartSearch, sortBy]);

  const {
    data: searchResults,
    error,
    isLoading,
    mutate,
  } = useSWR<SearchResult[]>(searchUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000,
  });

  // Set searching state based on SWR loading
  useEffect(() => {
    setIsSearching(isLoading);
  }, [isLoading]);

  // Generate filter options from search results - with null checks
  const filterOptions = useMemo(() => {
    const defaultFilters = {
      tags: [],
      schools: [],
      programs: [],
      resourceTypes: [],
      fileTypes: [],
      courseYears: [],
    };

    if (!searchResults || !Array.isArray(searchResults)) {
      return defaultFilters;
    }

    const tags = new Set<string>();
    const schools = new Set<string>();
    const programs = new Set<string>();
    const resourceTypes = new Set<string>();
    const fileTypes = new Set<string>();
    const courseYears = new Set<string>();

    searchResults.forEach((result) => {
      // Add null checks for each property
      if (result.tags && Array.isArray(result.tags)) {
        result.tags.forEach((tag) => tag && tags.add(tag));
      }
      if (result.school) schools.add(result.school);
      if (result.program) programs.add(result.program);
      if (result.resourceType) resourceTypes.add(result.resourceType);
      if (result.fileType) fileTypes.add(result.fileType);
      if (result.courseYear) courseYears.add(result.courseYear);
    });

    return {
      tags: Array.from(tags).sort(),
      schools: Array.from(schools).sort(),
      programs: Array.from(programs).sort(),
      resourceTypes: Array.from(resourceTypes).sort(),
      fileTypes: Array.from(fileTypes).sort(),
      courseYears: Array.from(courseYears).sort(),
    };
  }, [searchResults]);

  const courseYears = {
    "1": "1st Year",
    "2": "2nd Year",
    "3": "3rd Year",
    "4": "4th Year",
    "5": "5th Year",
  };

  // Filter and sort results (frontend processing) - with null checks
  const filteredAndSortedResults = useMemo(() => {
    if (!searchResults || !Array.isArray(searchResults)) return [];

    let filtered = [...searchResults];

    // Enhanced search - search in multiple fields
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter((result) => {
        if (!result) return false;

        return (
          (result.title && result.title.toLowerCase().includes(query)) ||
          (result.description &&
            result.description.toLowerCase().includes(query)) ||
          (result.tags &&
            Array.isArray(result.tags) &&
            result.tags.some(
              (tag) => tag && tag.toLowerCase().includes(query)
            )) ||
          (result.courseName &&
            result.courseName.toLowerCase().includes(query)) ||
          (result.school && result.school.toLowerCase().includes(query)) ||
          (result.program && result.program.toLowerCase().includes(query)) ||
          (result.uploader && result.uploader.toLowerCase().includes(query)) ||
          (result.resourceType &&
            result.resourceType.toLowerCase().includes(query))
        );
      });
    }

    // Apply filters - with null checks
    const hasActiveFilters =
      selectedFilters &&
      Object.values(selectedFilters).some((arr) => arr && arr.length > 0);

    if (hasActiveFilters) {
      filtered = filtered.filter((result) => {
        if (!result) return false;

        const matchesTags =
          !selectedFilters.tags ||
          selectedFilters.tags.length === 0 ||
          (result.tags &&
            Array.isArray(result.tags) &&
            selectedFilters.tags.some((tag) => result.tags.includes(tag)));

        const matchesSchools =
          !selectedFilters.schools ||
          selectedFilters.schools.length === 0 ||
          (result.school && selectedFilters.schools.includes(result.school));

        const matchesPrograms =
          !selectedFilters.programs ||
          selectedFilters.programs.length === 0 ||
          (result.program && selectedFilters.programs.includes(result.program));

        const matchesResourceTypes =
          !selectedFilters.resourceTypes ||
          selectedFilters.resourceTypes.length === 0 ||
          (result.resourceType &&
            selectedFilters.resourceTypes.includes(result.resourceType));

        const matchesFileTypes =
          !selectedFilters.fileTypes ||
          selectedFilters.fileTypes.length === 0 ||
          (result.fileType &&
            selectedFilters.fileTypes.includes(result.fileType));

        const matchesCourseYears =
          !selectedFilters.courseYears ||
          selectedFilters.courseYears.length === 0 ||
          (result.courseYear &&
            selectedFilters.courseYears.includes(result.courseYear));

        return (
          matchesTags &&
          matchesSchools &&
          matchesPrograms &&
          matchesResourceTypes &&
          matchesFileTypes &&
          matchesCourseYears
        );
      });
    }

    // Enhanced sorting
    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => {
          if (!a.uploadDate || !b.uploadDate) return 0;
          return (
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          );
        });
        break;
      case "title":
        filtered.sort((a, b) => {
          if (!a.title || !b.title) return 0;
          return a.title.localeCompare(b.title);
        });
        break;
      case "year":
        filtered.sort((a, b) => {
          const yearA = a.yearOfCreation || 0;
          const yearB = b.yearOfCreation || 0;
          return yearB - yearA;
        });
        break;
      case "school":
        filtered.sort((a, b) => {
          if (!a.school || !b.school) return 0;
          return a.school.localeCompare(b.school);
        });
        break;
      case "course":
        filtered.sort((a, b) => {
          if (!a.courseName || !b.courseName) return 0;
          return a.courseName.localeCompare(b.courseName);
        });
        break;
      case "uploader":
        filtered.sort((a, b) => {
          if (!a.uploader || !b.uploader) return 0;
          return a.uploader.localeCompare(b.uploader);
        });
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
  }, [searchResults, selectedFilters, sortBy, useSmartSearch, debouncedQuery]);

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

  const toggleFilter = (
    category: keyof typeof selectedFilters,
    value: string
  ) => {
    setSelectedFilters((prev) => {
      if (!prev || !prev[category]) return prev;

      return {
        ...prev,
        [category]: prev[category].includes(value)
          ? prev[category].filter((f) => f !== value)
          : [...prev[category], value],
      };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      tags: [],
      schools: [],
      programs: [],
      resourceTypes: [],
      fileTypes: [],
      courseYears: [],
    });
    setSearchQuery("");
    setDebouncedQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResultsPerPageChange = (value: string) => {
    setResultsPerPage(Number(value));
    setCurrentPage(1);
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
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download resource. Please try again.");
    } finally {
      setDownloadingResource(null);
    }
  }

  const getFileIcon = (fileType: string) => {
    if (!fileType) return <File className="h-3 w-3" />;

    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="h-3 w-3" />;
      default:
        return <File className="h-3 w-3" />;
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
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          items.push(i);
        }
        items.push("ellipsis");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
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
      <div className="min-h-screen py-4 sm:py-8 px-4">
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
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-6 sm:mb-8">
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
                <span className="">Filters</span>
                {selectedFilters &&
                  Object.values(selectedFilters).some(
                    (arr) => arr && arr.length > 0
                  ) && (
                    <Badge variant="secondary" className="ml-2">
                      {Object.values(selectedFilters).reduce(
                        (acc, arr) => acc + (arr ? arr.length : 0),
                        0
                      )}
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
            <Label
              htmlFor="smart-search"
              className="flex items-center gap-2 text-sm sm:text-base"
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="hidden sm:inline">
                Smart Search (AI-powered semantic search)
              </span>
              <span className="sm:hidden">AI Search</span>
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
          {(showFilters ||
            (selectedFilters &&
              Object.values(selectedFilters).some(
                (arr) => arr && arr.length > 0
              ))) && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Filters</h3>
                {selectedFilters &&
                  Object.values(selectedFilters).some(
                    (arr) => arr && arr.length > 0
                  ) && (
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

              <div className="space-y-4">
                {/* Tags */}
                {filterOptions.tags && filterOptions.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={
                            selectedFilters.tags &&
                            selectedFilters.tags.includes(tag)
                              ? "default"
                              : "outline"
                          }
                          className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                            isSearching ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() =>
                            !isSearching && toggleFilter("tags", tag)
                          }
                        >
                          {tag}
                          {selectedFilters.tags &&
                            selectedFilters.tags.includes(tag) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schools */}
                {filterOptions.schools && filterOptions.schools.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Schools</h4>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.schools.slice(0, 5).map((school) => (
                        <Badge
                          key={school}
                          variant={
                            selectedFilters.schools &&
                            selectedFilters.schools.includes(school)
                              ? "default"
                              : "outline"
                          }
                          className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                            isSearching ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() =>
                            !isSearching && toggleFilter("schools", school)
                          }
                        >
                          {school}
                          {selectedFilters.schools &&
                            selectedFilters.schools.includes(school) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resource Types */}
                {filterOptions.resourceTypes &&
                  filterOptions.resourceTypes.length > 1 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Resource Types
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.resourceTypes.map((type) => (
                          <Badge
                            key={type}
                            variant={
                              selectedFilters.resourceTypes &&
                              selectedFilters.resourceTypes.includes(type)
                                ? "default"
                                : "outline"
                            }
                            className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                              isSearching ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() =>
                              !isSearching &&
                              toggleFilter("resourceTypes", type)
                            }
                          >
                            {type}
                            {selectedFilters.resourceTypes &&
                              selectedFilters.resourceTypes.includes(type) && (
                                <X className="h-3 w-3 ml-1" />
                              )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Course Years */}
                {filterOptions.courseYears &&
                  filterOptions.courseYears.length > 1 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Course Years</h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.courseYears.map((year) => (
                          <Badge
                            key={year}
                            variant={
                              selectedFilters.courseYears &&
                              selectedFilters.courseYears.includes(year)
                                ? "default"
                                : "outline"
                            }
                            className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                              isSearching ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() =>
                              !isSearching && toggleFilter("courseYears", year)
                            }
                          >
                            {courseYears[year as keyof typeof courseYears] ||
                              `Year ${year}`}
                            {selectedFilters.courseYears &&
                              selectedFilters.courseYears.includes(year) && (
                                <X className="h-3 w-3 ml-1" />
                              )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* File Types */}
                {filterOptions.fileTypes &&
                  filterOptions.fileTypes.length > 1 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">File Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.fileTypes.map((type) => (
                          <Badge
                            key={type}
                            variant={
                              selectedFilters.fileTypes &&
                              selectedFilters.fileTypes.includes(type)
                                ? "default"
                                : "outline"
                            }
                            className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                              isSearching ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() =>
                              !isSearching && toggleFilter("fileTypes", type)
                            }
                          >
                            {type.toUpperCase()}
                            {selectedFilters.fileTypes &&
                              selectedFilters.fileTypes.includes(type) && (
                                <X className="h-3 w-3 ml-1" />
                              )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Sort Control and Results Per Page */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground text-sm sm:text-base">
                {isSearching ? (
                  "Searching..."
                ) : paginationData.totalResults > 0 ? (
                  <>
                    <span className="hidden sm:inline">
                      Showing {paginationData.startIndex} to{" "}
                      {paginationData.endIndex} of {paginationData.totalResults}{" "}
                      results
                    </span>
                    <span className="sm:hidden">
                      {paginationData.totalResults} results
                    </span>
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
              {(debouncedQuery ||
                (selectedFilters &&
                  Object.values(selectedFilters).some(
                    (arr) => arr && arr.length > 0
                  ))) &&
                !isSearching && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Clear search</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={resultsPerPage.toString()}
                onValueChange={handleResultsPerPageChange}
                disabled={isSearching}
              >
                <SelectTrigger className="w-full sm:w-auto">
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
                  <SelectItem value="year">Year of Creation</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="course">Course Name</SelectItem>
                  <SelectItem value="uploader">Uploader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4 mb-8">
          {isSearching ? (
            Array.from({ length: resultsPerPage }).map((_, i) => (
              <SearchResultSkeleton key={i} />
            ))
          ) : paginationData.currentResults.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">No resources found</CardTitle>
                <CardDescription className="mb-4">
                  {debouncedQuery ||
                  (selectedFilters &&
                    Object.values(selectedFilters).some(
                      (arr) => arr && arr.length > 0
                    ))
                    ? useSmartSearch
                      ? "Try adjusting your search terms, disabling AI search, or clearing filters"
                      : "Try adjusting your search terms, enabling AI search, or clearing filters"
                    : "No resources are available at the moment"}
                </CardDescription>
                {(debouncedQuery ||
                  (selectedFilters &&
                    Object.values(selectedFilters).some(
                      (arr) => arr && arr.length > 0
                    ))) && (
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
            paginationData.currentResults.map((result) => (
              <Card
                key={result.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg break-words">
                          {result.title}
                        </CardTitle>
                        {useSmartSearch && result.similarity && (
                          <Badge
                            variant="outline"
                            className="text-purple-600 border-purple-300 text-xs flex-shrink-0"
                          >
                            {Math.round(result.similarity * 100)}% match
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base mb-3 break-words">
                        {result.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {result.tags &&
                          Array.isArray(result.tags) &&
                          result.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className={`text-xs cursor-pointer transition-colors ${
                                selectedFilters.tags &&
                                selectedFilters.tags.includes(tag)
                                  ? "bg-primary/20"
                                  : ""
                              }`}
                              onClick={() => toggleFilter("tags", tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center justify-center gap-1 min-w-0">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <UserLink
                            username={result.uploader}
                            className="text-muted-foreground underline dark:hover:text-white hover:text-black truncate"
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Calendar className="h-3 w-3" />
                          {result.uploadDate &&
                            new Date(result.uploadDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {getFileIcon(result.fileType)}
                          {result.fileType && result.fileType.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground break-words">
                        <span className="font-medium">{result.school}</span> •{" "}
                        {result.courseName} •{" "}
                        {courseYears[
                          result.courseYear as keyof typeof courseYears
                        ] || `Year ${result.courseYear}`}
                      </div>
                    </div>

                    {/* Improved responsive button layout */}
                    <div className="flex flex-col gap-2 lg:w-auto w-full">
                      {/* Desktop: Vertical stack */}
                      <div className="hidden lg:flex lg:flex-col gap-2 mt-1">
                        <Button
                          variant="outline"
                          onClick={() => handlePreview(result)}
                          disabled={loadingPreview === result.id}
                          size="sm"
                        >
                          {loadingPreview === result.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span>Preview</span>
                        </Button>
                        <Link href={`/resource/${result.id}`}>
                          <Button
                            variant="outline"
                            className="bg-transparent"
                            size="sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>View Details</span>
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDownload(result)}
                          disabled={downloadingResource === result.id}
                          size="sm"
                        >
                          {downloadingResource === result.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span>Download</span>
                        </Button>
                      </div>

                      {/* Mobile: Two rows */}
                      <div className="lg:hidden space-y-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handlePreview(result)}
                            className="flex-1"
                            disabled={loadingPreview === result.id}
                            size="sm"
                          >
                            {loadingPreview === result.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4 mr-2" />
                            )}
                            <span className="truncate">Preview</span>
                          </Button>

                          <Link
                            href={`/resource/${result.id}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-full bg-transparent"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              <span className="truncate">Details</span>
                            </Button>
                          </Link>
                        </div>

                        <Button
                          onClick={() => handleDownload(result)}
                          className="w-full"
                          disabled={downloadingResource === result.id}
                          size="sm"
                        >
                          {downloadingResource === result.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          <span className="truncate">
                            {downloadingResource === result.id
                              ? "Downloading..."
                              : "Download"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 flex flex-col">
            <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl mb-2 pr-8 text-start break-words">
                  {previewResource?.title}
                </DialogTitle>
              </DialogHeader>
            </div>

            {previewResource && (
              <>
                <ScrollArea className="flex px-4 sm:px-6 min-h-0">
                  <div className="space-y-4 pb-4">
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

                        if (
                          previewResource.fileType &&
                          previewResource.fileType.toLowerCase() === "pdf"
                        ) {
                          return (
                            <iframe
                              src={url}
                              className="w-full h-60 sm:h-80 rounded-md border"
                              title="PDF Preview"
                            />
                          );
                        } else if (
                          previewResource.fileType &&
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

                <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-2 p-4 sm:p-6 pt-4 border-t rounded-b-lg bg-background">
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
