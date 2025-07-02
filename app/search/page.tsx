"use client";

import { useState } from "react";
import { Search, Download, Calendar, User } from "lucide-react";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  tags: string[];
  uploader: string;
  uploadDate: string;
  fileType: string;
  downloads: number;
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "Object Oriented Programming Midterm 2023",
    description:
      "Comprehensive midterm exam covering inheritance, polymorphism, and design patterns. Includes solutions and explanations.",
    tags: ["OOP", "2023", "Midterm", "Computer Science"],
    uploader: "Sarah Chen",
    uploadDate: "2023-10-15",
    fileType: "PDF",
    downloads: 245,
  },
  {
    id: "2",
    title: "Data Structures Final Exam Notes",
    description:
      "Complete study guide for data structures final exam including trees, graphs, and sorting algorithms.",
    tags: ["Data Structures", "Final", "Study Guide", "Algorithms"],
    uploader: "Anonymous",
    uploadDate: "2023-12-01",
    fileType: "PDF",
    downloads: 189,
  },
  {
    id: "3",
    title: "Calculus II Integration Techniques",
    description:
      "Detailed notes on integration by parts, substitution, and partial fractions with worked examples.",
    tags: ["Calculus", "Mathematics", "Integration", "Notes"],
    uploader: "Mike Johnson",
    uploadDate: "2023-11-20",
    fileType: "PDF",
    downloads: 156,
  },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filterOptions = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "2023",
    "2022",
    "2021",
    "Midterm",
    "Final",
    "Notes",
    "Past Papers",
  ];

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search for resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button size="lg" className="h-12 px-8">
              Search
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filterOptions.map((filter) => (
              <Badge
                key={filter}
                variant={
                  selectedFilters.includes(filter) ? "default" : "outline"
                }
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => toggleFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>

          {/* Sort Control */}
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Showing {mockResults.length} results
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Upload Date</SelectItem>
                <SelectItem value="downloads">Most Downloaded</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4 mb-8">
          {mockResults.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {result.title}
                    </CardTitle>
                    <CardDescription className="text-base mb-3">
                      {result.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {result.uploader}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(result.uploadDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {result.downloads} downloads
                      </div>
                    </div>
                  </div>
                  <Button className="ml-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
