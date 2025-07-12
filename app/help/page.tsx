import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Upload,
  MessageSquare,
  BookOpen,
  Users,
  Shield,
} from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      question: "Do I need to create an account to use UniVault?",
      answer:
        "No! You can browse, search, and even upload resources without creating an account. However, registered users get additional features like contribution tracking, email notifications, and profile management.",
    },
    {
      question: "How does the AI-powered search work?",
      answer:
        "Our search uses Google Gemini's text-embedding model to understand the meaning and context of your queries. You can search using natural language, or specific topics, and the AI will find relevant resources even if they don't contain your exact keywords.",
    },
    {
      question: "How long does it take for uploads to be approved?",
      answer:
        "All uploads go through an admin review process to ensure quality and relevance. This typically takes 24-48 hours. You'll receive an email notification once your resource is approved and live on the platform. (if you opt-in)",
    },
    {
      question: "What information should I include when uploading resources?",
      answer:
        "Please provide detailed metadata including your school, program, course name, and relevant tags. The more information you provide, the easier it will be for other students to find and benefit from your resources.",
    },
    {
      question: "How do resource requests work?",
      answer:
        "If you can't find a specific resource, submit a request describing what you need. Other users can then fulfill your request by uploading the requested material. You'll receive an email notification when someone helps you out. (if you opt-in)",
    },
    {
      question: "What types of files can I upload?",
      answer:
        "You can upload various academic materials including PDFs, documents, presentations, images, and other educational file formats. We support most common file types used in academic settings.",
    },
    {
      question: "Why am I not getting search results?",
      answer:
        "Try using different keywords, more general terms, or describe what you're looking for in natural language. If the AI Search does not work, use the normal search as it looks for keywords using debouncing techniques.",
    },
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "Best Practices",
      description:
        "Learn how to upload quality resources and write effective descriptions",
    },
    {
      icon: Users,
      title: "Community Guidelines",
      description:
        "Understand our community standards and how to contribute positively",
    },
    {
      icon: Shield,
      title: "Privacy & Safety",
      description:
        "Information about how we protect your data and maintain platform security",
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light mb-8">
            Help{" "}
            <span className="bg-foreground text-background px-4  rounded-md font-normal">
              Center
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions and get the support you need to
            make the most of UniVault's features.
          </p>
        </div>
        
        {/* FAQ */}
        <div className="mb-10">

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 ">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
              </div>
              
              <Separator className="mb-10"/>

        {/* Contact Info */}
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            Need more help? Contact us at{" "}
            <a
              href="mailto:univault.info@gmail.com"
              className="text-foreground hover:underline font-medium"
            >
              univault.info@gmail.com
            </a>
          </p>
          <p className="text-muted-foreground text-sm">
            We typically respond within 24 hours
          </p>
        </div>
      </main>
    </div>
  );
}
