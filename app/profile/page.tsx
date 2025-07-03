"use client";

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
import { User, BookOpen, Calendar, GraduationCap, School } from "lucide-react";
import Link from "next/link";

// Mock user data - replace with actual user data from your auth/database
const mockUser = {
  id: "user-123",
  email: "john.doe@university.edu",
  username: "johndoe",
  yearOfStudy: 3,
  graduatingYear: 2025,
  school: "SoCSE",
  program: "B.Tech",
  role: "MEMBER",
  resources: [
    {
      id: "1",
      title: "Data Structures Final Exam 2023",
      status: "APPROVED",
      createdAt: "2024-01-15T10:00:00Z",
      resourceType: "Past Papers",
      courseName: "Data Structures and Algorithms",
    },
    {
      id: "2",
      title: "Object Oriented Programming Notes",
      status: "PENDING",
      createdAt: "2024-01-20T14:30:00Z",
      resourceType: "Notes",
      courseName: "Object Oriented Programming with Java",
    },
    {
      id: "3",
      title: "Database Systems Lab Manual",
      status: "APPROVED",
      createdAt: "2024-01-10T09:15:00Z",
      resourceType: "Lab Manual",
      courseName: "Database Management Systems",
    },
  ],
};

const schoolNames = {
  SoCSE: "School of Computer Science & Engineering",
  SDI: "School of Design & Innovation",
  SoLAS: "School of Liberal Arts & Sciences",
  SoB: "School of Business",
  SoL: "School of Law",
};

export default function ProfilePage() {
  const user = mockUser;

  const approvedResources = user.resources.filter(
    (r) => r.status === "APPROVED"
  );
  const pendingResources = user.resources.filter((r) => r.status === "PENDING");

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
                  <p className="text-base">{user.username}</p>
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
                    {schoolNames[user.school as keyof typeof schoolNames] ||
                      user.school}
                  </p>
                </div>

                {user.program && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Program
                    </p>
                    <p className="text-base">{user.program}</p>
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

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href="/settings">Edit Profile</Link>
                  </Button>
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
                    {user.resources.map((resource) => (
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
