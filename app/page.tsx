import { Search, Upload, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: Upload,
      title: "Upload Resources",
      description:
        "Share your notes, past papers, and study materials with the community",
      href: "/upload",
    },
    {
      icon: FileText,
      title: "Request Resources",
      description:
        "Can't find what you need? Request specific materials from other students",
      href: "/request",
    },
    {
      icon: Users,
      title: "Admin Panel",
      description:
        "Manage uploads, requests, and users (admin access required)",
      href: "/admin",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Welcome to UniVault
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your college community's hub for academic resources. Search, share,
            and request past papers, notes, and study materials.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search for 'OOP 2023 midterm'..."
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground text-lg">
              Discover, share, and manage academic resources with ease
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Link href={feature.href}>Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of students already sharing and discovering academic
            resources
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/search">Browse Resources</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
