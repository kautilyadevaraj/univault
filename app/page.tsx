"use client";
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
import { LayoutGroup, motion } from "motion/react";
import TextRotate from "@/components/text-rotate";

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
      title: "Easy Access",
      description:
        "Create a Profile or not, you choose what you want.",
      href: "/profile",
    },
  ];

  return (
    <div className="w-full" suppressHydrationWarning>
      {/* Main content that sits on top of the footer */}
      <main className="relative z-10 min-h-screen bg-background">
        {/* Full Screen TextRotate Section */}
        <div className="w-full h-[95dvh] flex flex-row items-center justify-center font-overused-grotesk dark:text-muted text-foreground font-light overflow-hidden p-4 sm:p-8 md:p-12 lg:p-16">
          <LayoutGroup>
            <motion.p
              className="flex whitespace-pre text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
              layout
            >
              <motion.span
                className="pt-0.5 sm:pt-1 md:pt-1.5 lg:pt-2 dark:text-white"
                layout
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              >
                Resource{" "}
              </motion.span>
              <TextRotate
                texts={["Archive", "Roulette", "Portal", "Cult", ".exe", "SOS"]}
                mainClassName="text-white dark:text-black px-1.5 sm:px-2 md:px-2.5 lg:px-3 bg-primary overflow-hidden py-0.5 sm:py-1 md:py-1.5 lg:py-2 justify-center rounded-lg"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2000}
              />
            </motion.p>
          </LayoutGroup>
        </div>

        {/* Features Section */}
        <section className="py-12 bg-muted/100 sm:py-16 md:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Everything you need
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                Discover, share, and manage academic resources with ease
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
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
        <section className="bg-muted/100 py-12 sm:py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8">
              Join a community of students already sharing and discovering
              academic resources
            </p>
            <div className="flex sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/login">Create Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/search">Browse Resources</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Footer - sits behind the main content */}
      <footer className="sticky z-0 bottom-0 left-0 w-full h-60 sm:h-72 md:h-80 bg-background border-t flex justify-center items-center">
        <div className="relative overflow-hidden w-full h-full flex justify-end px-6 sm:px-8 md:px-12 text-right items-start py-6 sm:py-8 md:py-12 text-primary">
          <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-8 md:space-x-12 lg:space-x-16 text-base sm:text-base md:text-base lg:text-lg">
            <ul className="space-y-1 sm:space-y-2">
              <li className="hover:underline cursor-pointer">
                <Link href="/upload">Upload</Link>
              </li>
              <li className="hover:underline cursor-pointer">
                <Link href="/search">Search</Link>
              </li>
              <li className="hover:underline cursor-pointer">
                <Link href="/request">Request</Link>
              </li>
            </ul>
            <ul className="space-y-1 sm:space-y-2">
              <li className="hover:underline cursor-pointer">
                <Link href="/login">Join Us</Link>
              </li>
              <li className="hover:underline cursor-pointer">
                <Link href="/help">Help</Link>
              </li>
              <li className="hover:underline cursor-pointer">
                <Link
                  href="https://github.com/kautilyadevaraj/univault"
                  target="_blank"
                >
                  Github
                </Link>
              </li>
            </ul>
          </div>
          <h2 className="absolute bottom-0 left-0 translate-y-1/4 sm:translate-y-1/3 text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-primary font-bold opacity-20">
            UniVault
          </h2>
        </div>
      </footer>
    </div>
  );
}
