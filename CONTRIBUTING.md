# Contributing to Vonix Network

First off, thank you for considering contributing to Vonix Network! It's people like you that make Vonix Network such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to support@vonix.network.

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git
- Code editor (VS Code recommended)

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/vonix-network.git
   cd vonix-network
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/vonix-network/vonix-network.git
   ```

4. **Install dependencies**:
   ```bash
   npm run install-all
   ```

5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000` and frontend on `http://localhost:3000`.

## Development Workflow

### Branching Strategy

We use **Git Flow** branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

### Creating a Branch

Always branch from `develop`:

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/add-user-notifications`
- `bugfix/fix-login-validation`
- `hotfix/security-patch`
- `docs/update-api-documentation`

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. **Check existing issues** to avoid duplicates
2. **Collect information** about the bug
3. **Create a detailed report**

Bug report should include:
- **Clear title** - Brief description
- **Steps to reproduce** - Detailed steps
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Environment** - OS, Node version, browser
- **Screenshots** - If applicable
- **Error messages** - Console output

Use the bug report template when creating an issue.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues:
1. **Check existing suggestions** first
2. **Provide clear use case** and benefits
3. **Explain implementation** if possible

Enhancement suggestion should include:
- **Clear title** - What you want to add
- **Motivation** - Why it's useful
- **Detailed description** - How it works
- **Alternatives** - Other solutions considered
- **Additional context** - Examples, mockups

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Need community help
- `beginner friendly` - Easy to tackle

### Pull Requests

1. **Follow coding standards** (see below)
2. **Include tests** for new functionality
3. **Update documentation** as needed
4. **Keep commits clean** and well-described
5. **Link related issues** in PR description

## Coding Standards

### JavaScript/TypeScript Style

We follow industry best practices:

#### General Rules
- Use **ES6+** syntax
- Use **async/await** over callbacks
- Use **const** by default, **let** when needed, avoid **var**
- Use **destructuring** when appropriate
- Use **template literals** for strings
- **4 spaces** for indentation (no tabs)
- **Semicolons** required
- **Single quotes** for strings (except JSON)

#### Example

```javascript
// Good
const getUserById = async (id) => {
  const user = await db.users.findOne({ id });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// Bad
var getUserById = function(id, callback) {
  db.users.findOne({ id }, function(err, user) {
    if (err) return callback(err);
    callback(null, user);
  });
};
```

### Backend Standards

#### File Organization
- One main export per file
- Group related functions
- Keep files under 300 lines

#### Route Handlers
```javascript
// routes/users.js
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

#### Error Handling
```javascript
// Always use try-catch in async functions
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new AppError('User-friendly message', 500);
}
```

#### Database Queries
```javascript
// Use parameterized queries (SQL injection prevention)
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);

// Never concatenate user input
// BAD: db.prepare(`SELECT * FROM users WHERE id = ${userId}`)
```

### Frontend Standards

#### Component Structure
```typescript
// components/UserCard.tsx
import React from 'react';

interface UserCardProps {
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
  onSelect?: (id: number) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => {
  return (
    <div className="user-card" onClick={() => onSelect?.(user.id)}>
      <img src={user.avatar_url} alt={user.username} />
      <h3>{user.username}</h3>
    </div>
  );
};
```

#### State Management
- Use **React hooks** (useState, useEffect, etc.)
- Keep state close to where it's used
- Use **Context API** for global state
- Avoid prop drilling

#### API Calls
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const getUser = async (id: number) => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};
```

### CSS/Styling
- Use **BEM methodology** for class names
- Keep styles **component-scoped**
- Use **CSS variables** for theming
- Mobile-first responsive design

```css
/* BEM Example */
.user-card { }
.user-card__avatar { }
.user-card__name { }
.user-card--featured { }
```

## Testing Guidelines

### Writing Tests

All new features must include tests:

#### Backend Tests
```javascript
// __tests__/users.test.js
const request = require('supertest');
const app = require('../server/index');

describe('User API', () => {
  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const res = await request(app)
        .get('/api/users/1')
        .expect(200);
      
      expect(res.body).toHaveProperty('username');
      expect(res.body.id).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/99999')
        .expect(404);
    });
  });
});
```

#### Frontend Tests
```typescript
// components/__tests__/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from '../UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  it('renders user information', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<UserCard user={mockUser} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('testuser'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (recommended for development)
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Test Coverage

- Aim for **>80% coverage** on new code
- All public APIs must have tests
- Critical paths require comprehensive tests

## Commit Guidelines

### Commit Message Format

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes

#### Examples

```bash
feat(auth): add password reset functionality

- Add reset password endpoint
- Send email with reset token
- Add reset form to frontend

Closes #123
```

```bash
fix(forum): prevent duplicate post submissions

Add loading state to prevent double-click submissions

Fixes #456
```

```bash
docs(api): update authentication documentation

- Add JWT token refresh example
- Document rate limits
- Fix typos in error codes
```

### Commit Best Practices

- **One logical change per commit**
- **Present tense** ("add feature" not "added feature")
- **Imperative mood** ("move cursor to..." not "moves cursor to...")
- **No period** at end of subject line
- **Wrap body at 72 characters**
- **Reference issues** in footer

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout your-branch
   git rebase develop
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Lint your code**:
   ```bash
   npm run lint  # If available
   ```

4. **Update documentation** if needed

5. **Test manually** in browser/environment

### Submitting PR

1. **Push to your fork**:
   ```bash
   git push origin your-branch
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template** completely:
   - Description of changes
   - Related issues
   - Type of change
   - Testing performed
   - Screenshots (if UI changes)

4. **Wait for review**

### PR Title Format

Use same format as commit messages:
```
feat(auth): add OAuth2 integration
fix(forum): resolve pagination bug
docs(readme): update installation steps
```

### Review Process

1. **Automated checks** must pass (tests, linting)
2. **Code review** by maintainer(s)
3. **Requested changes** - Make updates and push
4. **Approval** - PR will be merged
5. **Squash and merge** - Commits will be combined

### After Merge

1. **Delete your branch**:
   ```bash
   git branch -d feature/your-feature
   git push origin --delete feature/your-feature
   ```

2. **Update local develop**:
   ```bash
   git checkout develop
   git pull upstream develop
   ```

## Code Review Guidelines

### For Authors

- **Be responsive** to feedback
- **Don't take it personally** - reviews improve code
- **Ask questions** if feedback is unclear
- **Explain your decisions** when asked

### For Reviewers

- **Be respectful** and constructive
- **Ask questions** rather than make demands
- **Approve** when satisfied
- **Suggest alternatives** with reasoning

## Development Tools

### Recommended VS Code Extensions

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **GitLens** - Git integration
- **Thunder Client** - API testing
- **SQLite Viewer** - Database inspection

### Debugging

#### Backend
```javascript
// Use debug module
const debug = require('debug')('app:users');
debug('Fetching user %s', userId);
```

Or Node.js debugger:
```bash
node --inspect server/index.js
```

#### Frontend
Use React DevTools browser extension and Chrome/Firefox DevTools.

## Community

### Communication Channels

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - General questions, ideas
- **Discord Server** - Real-time chat, community support
- **Email** - support@vonix.network

### Getting Help

1. **Check documentation** first
2. **Search existing issues**
3. **Ask in Discord** for quick questions
4. **Create GitHub issue** for bugs/features

## Recognition

Contributors will be:
- Listed in **CONTRIBUTORS.md**
- Credited in **release notes**
- Given **Contributor role** on Discord

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Quick Reference

### Common Commands

```bash
# Setup
npm run install-all          # Install all dependencies
cp .env.example .env         # Create environment file

# Development
npm run dev                  # Start dev servers
npm run server               # Backend only
npm run client               # Frontend only

# Testing
npm test                     # Run tests
npm run test:watch           # Watch mode
npm test -- --coverage       # Coverage report

# Building
npm run build                # Build frontend

# Production
npm start                    # Start production server

# Utilities
npm run backup               # Backup database
node check-users.js          # Check users
node create-test-user.js     # Create test user
```

### Need Help?

- 📖 [Documentation](README.md)
- 🐛 [Report Bug](https://github.com/vonix-network/vonix-network/issues/new?template=bug_report.md)
- 💡 [Request Feature](https://github.com/vonix-network/vonix-network/issues/new?template=feature_request.md)
- 💬 [Discord Community](https://discord.gg/vonix)

---

**Thank you for contributing to Vonix Network! 🎉**
