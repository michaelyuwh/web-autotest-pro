# Web AutoTest Pro - Browser-Based Automated Testing Tool

![Web AutoTest Pro Logo](docs/images/logo.png)

A modern, AI-powered browser testing tool that simplifies web testing for non-technical users while providing advanced capabilities for developers.

## 🌟 Features

- **Intuitive Recording**: Visual test recording with Picture-in-Picture controls
- **AI-Powered**: Local Phi-3 mini integration for smart test optimization
- **Cross-Browser Support**: Chrome, Firefox, Edge, Safari, and IE mode
- **Liquid Glass UI**: Modern, translucent interface with fluid animations
- **Video Recording**: Capture test executions with action overlays
- **Comprehensive Reports**: Export to PDF, HTML, JSON, CSV, Markdown, XML
- **Mobile Companion**: Android app with Jetpack Compose
- **Flexible Deployment**: Browser extension, PWA, or Docker

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Modern browser with WebGPU support (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/autotest-pro.git
cd autotest-pro

# Install dependencies
npm run install:all

# Install Playwright browsers
npm run playwright:install

# Start development server
npm run dev
```

### Browser Extension
```bash
# Build extension
npm run build:extension

# Load unpacked extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select extension/dist
```

### PWA Deployment
```bash
# Build and run with Docker
npm run build:docker
docker run -p 443:443 autotest-pro

# Or deploy on-premise
npm run build:web
# Serve web-app/dist via HTTPS
```

## 📱 Android Companion App

```bash
# Build Android app
npm run android:build

# Run tests
npm run android:test
```

## 🏗️ Project Structure

```
autotest-pro/
├── web-app/           # React PWA application
├── extension/         # Browser extension
├── android-app/       # Jetpack Compose mobile app
├── shared/           # Shared utilities and types
├── docker/           # Docker configuration
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## 🤖 AI Integration

Web AutoTest Pro includes a local Phi-3 mini LLM that provides:
- Smart test case generation
- Automatic error debugging
- Selector optimization
- Performance recommendations

AI features require WebGPU support for optimal performance, with WASM fallback.

## 🌐 Browser Compatibility

| Browser | Recording | Playback | AI | Video | PiP |
|---------|-----------|----------|----|----- |-----|
| Chrome  | ✅        | ✅       | ✅ | ✅   | ✅  |
| Firefox | ✅        | ✅       | ✅ | ✅   | ✅  |
| Edge    | ✅        | ✅       | ✅ | ✅   | ✅  |
| Safari  | ✅        | ✅       | ✅ | ⚠️*  | ✅  |
| IE Mode | ⚠️**      | ⚠️**     | ❌ | ❌   | ❌  |

*Safari uses html2canvas fallback for video recording
**IE mode has limited functionality

## 📖 Documentation

- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Android App Guide](docs/android-guide.md)

## 🛠️ Development

```bash
# Run all tests
npm test

# Lint code
npm run lint

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

## 📊 Performance

- Recording: <100ms per action
- AI inference: 10-20 tokens/second
- Storage: <50MB per test suite
- Memory: <500MB with AI enabled

## 🔒 Privacy & Security

- All data processed locally
- No external AI APIs
- GDPR/CCPA compliant
- Encrypted sensitive data
- Optional cloud sync

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- [Issue Tracker](https://github.com/your-org/autotest-pro/issues)
- [Discussions](https://github.com/your-org/autotest-pro/discussions)
- [Documentation](https://autotest-pro.docs.com)

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Playwright](https://playwright.dev/)
- AI by [Microsoft Phi-3](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct)
- Mobile app with [Jetpack Compose](https://developer.android.com/jetpack/compose)

---

Made with ❤️ by the Web AutoTest Pro team