# TaskFlow

A collaborative project management web app that helps teams stay organized, assign work clearly, and track progress in real time.

## Overview

TaskFlow lets a team leader create a project, invite members, and assign tasks to the right people. Everyone can see what's in progress, what's pending, and what's done — through a Kanban-style board that updates as work moves forward.

## Features

- **Authentication** — Secure login and registration with protected routes
- **Project Management** — Create projects and invite members to collaborate
- **Task Assignment** — Create tasks and assign them to specific team members
- **Kanban Board** — Visual task tracking with status columns (To Do / In Progress / Review / Done)
- **My Tasks** — Personal view of all tasks assigned to you
- **Notifications** — Stay updated on project and task activity
- **Dark Mode** — Toggle between light and dark themes

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |

## Live Projects

| Name | Description | Live Demo |
|---|---|---|
| TaskFlow | A collaborative project management tool where team leaders create projects, assign tasks to members, and track progress through a Kanban-style board. | [**Live Demo →**](https://taskflow-nine-mu.vercel.app/) |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/ReyFrancisS/Taskflow.git
cd taskflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key to .env

# Run the development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
