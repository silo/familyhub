# Contributing to FamilyHub

First off, thank you for considering contributing to FamilyHub! It's people like you that make FamilyHub such a great tool for families everywhere.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming environment. By participating, you are expected to uphold this standard. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, browser, Docker version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies** with `pnpm install`
3. **Make your changes** following our coding conventions
4. **Test your changes** thoroughly
5. **Update documentation** if needed
6. **Submit your pull request**

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for PostgreSQL)
- Git

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/familyhub.git
cd familyhub

# Install dependencies
pnpm install

# Start the database
docker compose up db -d

# Copy environment variables
cp .env.example .env

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Project Structure

```
familyhub/
├── app/                    # Frontend (Nuxt pages, components, composables)
│   ├── components/         # Vue components
│   ├── composables/        # Vue composables
│   ├── layouts/            # Page layouts
│   ├── middleware/         # Route middleware
│   └── pages/              # File-based routing
├── server/                 # Backend (API routes, database)
│   ├── api/                # API endpoints
│   ├── db/                 # Database schema and migrations
│   ├── middleware/         # Server middleware
│   └── utils/              # Server utilities
├── shared/                 # Shared code between app and server
└── public/                 # Static assets
```

## Coding Conventions

### TypeScript

- Use strict mode
- Define types explicitly when not inferrable
- Use Zod for API input validation

### Vue/Nuxt

- Use `<script setup lang="ts">` for all components
- Prefer composables for shared logic
- Use NuxtUI components where possible

### Styling

- Use Tailwind CSS (via NuxtUI)
- Follow mobile-first responsive design
- Maintain consistent spacing and sizing

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests when relevant

## Questions?

Feel free to open a discussion on GitHub if you have any questions!
