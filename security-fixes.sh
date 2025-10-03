#!/bin/bash

# Critical Security Fixes for Web AutoTest Pro
# Run this script to address immediate security vulnerabilities

echo "🔒 Starting Security Vulnerability Fixes..."

# 1. Update vulnerable dependencies
echo "📦 Updating vulnerable dependencies..."
npm update jspdf@3.0.3
npm update vite@7.1.9  
npm update dompurify@3.2.4

# 2. Run security audit with fixes
echo "🛡️ Running security audit..."
npm audit fix --force

# 3. Check for remaining vulnerabilities
echo "✅ Checking remaining issues..."
npm audit --audit-level=moderate

# 4. Update package-lock.json
echo "🔄 Updating lock file..."
npm ci

echo "🎉 Security fixes completed!"
echo "ℹ️  Please review the changes and test functionality before committing."

# 5. Display security status
echo "📊 Final security status:"
npm audit --audit-level=high --json | jq '.metadata.vulnerabilities'