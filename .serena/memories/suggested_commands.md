# SHEIKE Development Commands

## Core Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Quality Assurance Commands
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type coverage check (minimum 90%)
npm run types:coverage

# API type definitions test
npm run types:api
```

## System Commands (macOS/Darwin)
```bash
# File operations
ls -la          # List files with details
find . -name    # Find files by name
grep -r         # Search in files recursively

# Git operations
git status      # Check repository status
git add .       # Stage all changes
git commit -m   # Commit with message
git push        # Push to remote

# Package management
npm install     # Install dependencies
npm update      # Update packages
npm audit       # Security audit
```

## Task Completion Checklist
When completing any development task, always run:
1. `npm run typecheck` - Ensure no TypeScript errors
2. `npm run lint` - Check code style compliance
3. `npm run types:coverage` - Verify 90% type coverage
4. `npm run build` - Ensure production build works

## MediaPipe Specific Notes
- Requires proper CORS headers for WASM loading
- Test on mobile devices for camera functionality
- Validate face angle and lighting quality