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
import { toast } from "sonner";

const popularRequests = [
  "Data Structures Final 2023",
  "Calculus III Integration Notes",
  "Operating Systems Lab Manual",
  "Database Design Project Examples",
  "Linear Algebra Midterm Solutions",
  "Computer Networks Past Papers",
  "Software Engineering Case Studies",
  "Statistics Formula Sheet",
];

export default function RequestPage() {
  const [request, setRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!request.trim()) {
      toast.error("Please enter your request");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setRequest("");
      toast.success(
        "Request submitted successfully! We'll notify you when someone fulfills it."
      );
    }, 1000);
  };

  const handleQuickRequest = (requestText: string) => {
    setRequest(requestText);
  };

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
            <CardTitle>What are you looking for?</CardTitle>
            <CardDescription>
              Be specific about the course, topic, and type of resource you need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request">Resource Request</Label>
                <Input
                  id="request"
                  placeholder="e.g., Machine Learning Final Exam 2023 with solutions"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !request.trim()}
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
              Click on any of these popular requests to quickly submit them
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

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Submit your request with specific details</li>
            <li>2. Other students and admins will see your request</li>
            <li>3. When someone uploads the resource, you'll be notified</li>
            <li>4. Download the resource once it's approved</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
