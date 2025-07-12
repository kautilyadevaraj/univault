# UniVault
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/kautilyadevaraj/univault)

UniVault is a modern, collaborative platform for university students to share, find, and request academic resources. It features an AI-powered semantic search, a robust admin moderation system, and user-centric features to create a thriving community resource hub.
The website can be accessed here - https://univault-portal.vercel.app/

## Key Features

-   **AI-Powered Semantic Search**: Find resources based on meaning and context, not just keywords, powered by Google Gemini embeddings.
-   **Resource Upload & Download**: Securely upload study materials and download them via pre-signed, time-limited URLs.
-   **Community Requests**: Post public requests for materials you can't find. Other users or admins can fulfill them.
-   **User Profiles & Privacy**: Create a personal profile, track your contributions, and manage detailed privacy settings.
-   **Admin Dashboard**: A comprehensive panel for admins to review and approve uploads, manage users, and fulfill resource requests.
-   **Email Notifications**: Get notified when your upload is approved or a request you're subscribed to is fulfilled.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) & [pgvector](https://github.com/pgvector/pgvector)
-   **Authentication**: [Supabase](https://supabase.io/)
-   **File Storage**: Backblaze B2
-   **AI & Embeddings**: [Google Gemini](https://ai.google.dev/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **Data Fetching**: [SWR](https://swr.vercel.app/)
-   **Email**: Gmail API

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or later)
-   [npm](https://npmjs.com) (or your preferred package manager)
-   A [PostgreSQL](https://www.postgresql.org/) database
-   Access keys for Supabase, Google, and an S3-compatible service.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kautilyadevaraj/univault.git
    cd univault
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory by copying the example below. Fill in the required values from your service provider dashboards.

    ```env
    # Prisma - PostgreSQL Database
    # Make sure your PostgreSQL database is running
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
    DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

    # Supabase - Authentication
    NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
    NEXT_PUBLIC_BASE_URL="http://localhost:3000"

    # Gemini - AI Embeddings for Semantic Search
    GEMINI_API_KEY="your-gemini-api-key"

    # Backblaze B2 / AWS S3 - File Storage
    B2_REGION="your-b2-or-s3-region"
    B2_ENDPOINT="https://s3.your-region.backblazeb2.com"
    B2_ACCESS_KEY_ID="your-access-key-id"
    B2_SECRET_ACCESS_KEY="your-secret-access-key"
    B2_BUCKET_NAME="your-bucket-name"

    # Gmail API configuration
    SENDER_EMAIL="your-gmail-address@gmail.com"
    GOOGLE_CLIENT_ID="your-google-oauth-client-id"
    GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
    GOOGLE_REDIRECT_URI="https://developers.google.com/oauthplayground"
    GOOGLE_REFRESH_TOKEN="your-google-oauth-refresh-token"
    ```

4.  **Set up the database:**
    -   Connect to your PostgreSQL database and enable the `pgvector` extension:
        ```sql
        CREATE EXTENSION IF NOT EXISTS vector;
        ```
    -   Apply the database schema using Prisma:
        ```bash
        npm prisma migrate dev
        ```

5.  **Generate Prisma Client:**
    ```bash
    npm prisma generate
    ```

6.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Application Structure

-   `app/`: Contains all pages and API routes following the Next.js App Router structure.
    -   `app/(pages)`: Frontend pages for different features (`/search`, `/upload`, `/profile`, `/admin`, etc.).
    -   `app/api`: All backend API endpoints, organized by feature (`/api/upload`, `/api/search`, `/api/admin`).
-   `components/`: Shared React components.
    -   `components/ui`: Core UI components from shadcn/ui.
    -   `components/admin`: Components specific to the admin dashboard.
-   `lib/`: Core application logic, helpers, and services.
    -   `lib/prisma.ts`: Prisma client instance.
    -   `lib/gemini.ts`: Logic for generating text embeddings.
    -   `lib/mailer.ts`: Service for sending emails.
    -   `lib/hooks`: Custom React hooks for authentication and user profiles.
-   `prisma/`: Database schema (`schema.prisma`) and migrations.
-   `utils/supabase`: Supabase client and server-side helpers.