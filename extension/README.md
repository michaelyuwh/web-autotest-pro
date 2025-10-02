# Web AutoTest Pro Browser Extension Development Guide

## Building the Extension

### Development Build
```bash
npm run dev
```
This creates a development build with source maps and watches for changes.

### Production Build
```bash
npm run build
```
This creates an optimized production build.

### Loading in Browser

#### Chrome/Edge
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

#### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the `extension/dist` folder

## Testing the Extension

1. **Build the extension** using `npm run build`
2. **Load in browser** following the steps above
3. **Click the extension icon** in the toolbar to open the popup
4. **Try recording** on any webpage:
   - Click "Start Recording"
   - Interact with the page (click, type, etc.)
   - Click "Stop Recording"
5. **Open settings** to configure the extension
6. **Use Picture-in-Picture** mode for advanced recording

## Features Implemented

### Core Recording
- ✅ DOM event capture (click, input, navigation)
- ✅ Selector optimization for reliability
- ✅ Action timestamp recording
- ✅ Cross-frame recording support

### User Interface
- ✅ Modern popup with recording controls
- ✅ Comprehensive settings page
- ✅ Real-time recording status updates
- ✅ Picture-in-Picture recording interface

### Data Management
- ✅ IndexedDB storage for test cases
- ✅ Export functionality (JSON, Playwright, etc.)
- ✅ Settings synchronization across browser instances

### Integration
- ✅ Web app communication
- ✅ Shared utilities with main application
- ✅ Cross-browser compatibility layer

## Next Steps

1. **Add icons** to the `icons/` folder (16, 32, 48, 128 px)
2. **Test across browsers** (Chrome, Firefox, Edge)
3. **Integrate AI features** with Phi-3 mini model
4. **Connect to web application** for advanced test management
5. **Add video recording** capabilities for test execution

## Architecture

```
extension/
├── src/
│   ├── background.ts     # Service worker (extension lifecycle)
│   ├── content.ts        # DOM recording and interaction
│   ├── popup.ts          # Popup interface controller
│   ├── options.ts        # Settings page controller
│   ├── popup.html        # Popup UI
│   └── options.html      # Settings UI
├── dist/                 # Built extension files (load this in browser)
├── webpack.config.js     # Build configuration
├── tsconfig.json         # TypeScript configuration
└── manifest.json         # Extension manifest (V3)
```