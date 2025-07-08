"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  User,
  LogOut,
  Home,
  Search,
  Upload,
  MessageSquare,
  Shield,
  UserCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Theme from "./Theme";
import Image from "next/image";
import Logo from "@/public/logo.png";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useAuth } from "@/lib/hooks/useAuth";

export function Navbar() {
  const { user, profile, loading } = useUserProfile();
  const { logout, isLoading: isLoggingOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/request", label: "Request", icon: MessageSquare },
  ];

  const adminLinks = [];
  const userLinks = [{ href: "/profile", label: "Profile", icon: UserCircle }];

  if (profile?.role === "ADMIN") {
    adminLinks.push({ href: "/admin", label: "Admin Panel", icon: Shield });
  }

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false); // Close mobile menu after logout
  };

  // Show loading skeleton while user data is being fetched
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src={Logo || "/placeholder.svg"}
                alt="UniVault Logo"
                className="h-10 w-10"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">
                  UniVault
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Resource Hub
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <Theme />
            </div>

            <div className="flex items-center space-x-2 md:hidden">
              <Theme />
              <Button variant="ghost" size="icon" disabled>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src={Logo || "/placeholder.svg"}
              alt="UniVault Logo"
              className="h-10 w-10"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">UniVault</span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Resource Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 h-10 px-3"
                      disabled={isLoggingOut}
                    >
                      <Avatar className="h-8 w-8 border-2">
                        <AvatarImage
                          src={profile?.profilePicture || "/placeholder.svg"}
                          alt={profile?.email + " profile picture"}
                        />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(profile?.username, profile?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {profile?.username || "User"}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Badge
                            variant={
                              profile?.role === "ADMIN"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs px-1.5 py-0"
                          >
                            {profile?.role || "USER"}
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {profile?.username || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {userLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem key={link.href} asChild>
                          <Link
                            href={link.href}
                            className="flex items-center space-x-2"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{link.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="text-red-600 focus:text-red-600"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                      )}
                      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild>
                  <Link href="/login">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
              </div>
            )}
            <Theme />
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center space-x-2 md:hidden">
            <Theme />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoggingOut}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <Image
                      src={Logo || "/placeholder.svg"}
                      alt="UniVault"
                      className="h-8 w-8"
                    />
                    <span>UniVault</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col space-y-6 mt-6">
                  {/* User Info Section */}
                  {user && (
                    <div className="flex items-center space-x-3 p-4 bg-accent/50 rounded-lg">
                      <Avatar className="h-12 w-12 border-2">
                        <AvatarImage
                          src={profile?.profilePicture || "/placeholder.svg"}
                          alt={profile?.email}
                        />
                        <AvatarFallback>
                          {getUserInitials(profile?.username, profile?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {profile?.username || "User"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {profile?.email}
                        </span>
                        <Badge
                          variant={
                            profile?.role === "ADMIN" ? "default" : "secondary"
                          }
                          className="text-xs px-1.5 py-0 w-fit mt-1"
                        >
                          {profile?.role || "USER"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                      Navigation
                    </h3>
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center space-x-3 px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Admin Links */}
                  {adminLinks.length > 0 && (
                    <div className="space-y-1">
                      <Separator />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                        Admin
                      </h3>
                      {adminLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center space-x-3 px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* User Account Links */}
                  {user && userLinks.length > 0 && (
                    <div className="space-y-1">
                      <Separator />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                        Account
                      </h3>
                      {userLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center space-x-3 px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Auth Actions */}
                  <div className="pt-4">
                    {user ? (
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="justify-start"
                        size="lg"
                      >
                        {isLoggingOut ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4 mr-2" />
                        )}
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </Button>
                    ) : (
                      <Button asChild className="ml-3">
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          <User className="h-4 w-4 mr-2" />
                          Login
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
