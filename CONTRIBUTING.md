# Contributing to Web AutoTest Pro

Thank you for your interest in contributing to Web AutoTest Pro! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes or new features
- **Documentation**: Improve our documentation and guides
- **Testing**: Help test new features and report issues
- **Community Support**: Help other users in discussions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git for version control
- Modern browser (Chrome 88+, Firefox 78+)
- Basic knowledge of TypeScript/React

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/web-autotest-pro.git
   cd web-autotest-pro
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install component dependencies  
   cd web-app && npm install && cd ..
   cd extension && npm install && cd ..
   cd android-app/web-autotest-companion && npm install && cd ../..
   ```

3. **Start Development Environment**
   ```bash
   # Start web application
   cd web-app && npm run dev
   
   # In another terminal, start browser extension
   cd extension && npm run dev
   
   # In another terminal, start Android app
   cd android-app/web-autotest-companion && expo start
   ```

4. **Verify Setup**
   ```bash
   # Run tests to ensure everything works
   npm run test:all
   ```

## 🔧 Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features (`feature/ai-optimization`)
- **bugfix/**: Bug fixes (`bugfix/selector-issue`)
- **hotfix/**: Critical production fixes

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow our coding standards (see below)
   - Write or update tests for your changes
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   # Run all tests
   npm run test:all
   
   # Run linting
   npm run lint
   
   # Run type checking
   npm run type-check
   ```

4. **Commit Your Changes**
   ```bash
   # Use conventional commit format
   git commit -m "feat: add AI-powered element detection"
   git commit -m "fix: resolve selector generation issue"
   git commit -m "docs: update API documentation"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Coding Standards

### TypeScript Guidelines

- **Strict Mode**: All TypeScript must compile without errors
- **Type Safety**: Avoid `any` types, use proper interfaces
- **Naming**: Use PascalCase for types, camelCase for variables
- **Exports**: Use named exports over default exports

```typescript
// ✅ Good
interface TestCase {
  id: string;
  name: string;
  steps: TestStep[];
}

export const generateTestCase = (data: TestCaseData): TestCase => {
  // implementation
};

// ❌ Avoid
const generateTestCase = (data: any) => {
  // implementation
};
```

### React Components

- **Functional Components**: Use hooks over class components
- **Props Interface**: Define explicit prop interfaces
- **Component Names**: Use PascalCase
- **File Structure**: One component per file

```typescript
// ✅ Good
interface TestRecorderProps {
  onStart: () => void;
  onStop: (testCase: TestCase) => void;
  isRecording: boolean;
}

export const TestRecorder: React.FC<TestRecorderProps> = ({
  onStart,
  onStop,
  isRecording
}) => {
  // component implementation
};
```

### Styling Guidelines

- **Tailwind CSS**: Use utility classes for styling
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Include ARIA labels and semantic HTML
- **Dark Mode**: Support both light and dark themes

```typescript
// ✅ Good
<button 
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  aria-label="Start recording test case"
>
  Start Recording
</button>
```

## 🧪 Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Coverage**: Maintain 80%+ code coverage

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { TestRecorder } from '../TestRecorder';

describe('TestRecorder', () => {
  it('should start recording when button clicked', () => {
    const mockOnStart = jest.fn();
    
    render(<TestRecorder onStart={mockOnStart} onStop={jest.fn()} isRecording={false} />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);
    
    expect(mockOnStart).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- TestRecorder

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📖 Documentation Standards

### Code Documentation

- **JSDoc Comments**: Document all public functions
- **README Files**: Each component should have a README
- **Inline Comments**: Explain complex logic
- **Type Documentation**: Document complex types

```typescript
/**
 * Generates an optimal CSS selector for a DOM element using AI
 * @param element - The DOM element to generate selector for
 * @param options - Configuration options for selector generation
 * @returns Promise resolving to the optimal CSS selector
 */
export async function generateOptimalSelector(
  element: Element,
  options: SelectorOptions = {}
): Promise<string> {
  // implementation
}
```

### Documentation Updates

- Update relevant documentation when making changes
- Include code examples in documentation
- Keep documentation up-to-date with code changes
- Use clear, concise language

## 🐛 Bug Reports

### Before Submitting

1. Check existing issues to avoid duplicates
2. Update to the latest version
3. Test in multiple browsers if applicable

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 96]
- Version: [e.g. 1.0.0]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Problem Solved**
What problem does this solve?

**Proposed Solution**
How would you like it implemented?

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Screenshots, mockups, or examples
```

## 🔍 Pull Request Guidelines

### PR Requirements

- **Description**: Clear description of changes
- **Tests**: Include tests for new functionality
- **Documentation**: Update relevant documentation
- **No Breaking Changes**: Avoid breaking existing APIs
- **Small Focused Changes**: Keep PRs focused and small

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors/warnings
```

### Review Process

1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Thoroughly test changes
4. **Documentation**: Ensure docs are updated
5. **Merge**: Squash and merge when approved

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. Create release branch from `develop`
2. Update version numbers
3. Update CHANGELOG.md
4. Create pull request to `main`
5. After merge, tag the release
6. Deploy to production

## 🤝 Community Guidelines

### Code of Conduct

- **Be Respectful**: Treat everyone with respect
- **Be Inclusive**: Welcome people of all backgrounds
- **Be Constructive**: Provide helpful feedback
- **Be Patient**: Help newcomers learn
- **Be Collaborative**: Work together toward common goals

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time community chat
- **Twitter**: Project updates and announcements

## 📞 Getting Help

- **Documentation**: Check our comprehensive docs
- **GitHub Issues**: Search existing issues
- **Discussions**: Ask questions in GitHub Discussions
- **Discord**: Join our community server
- **Email**: Contact maintainers directly

## 🙏 Recognition

Contributors will be recognized in:
- **CONTRIBUTORS.md**: All contributors listed
- **Release Notes**: Major contributors highlighted
- **README**: Core team and frequent contributors
- **Annual Report**: Outstanding contributors recognized

Thank you for contributing to Web AutoTest Pro! 🚀