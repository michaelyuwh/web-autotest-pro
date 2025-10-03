#!/bin/bash

# TypeScript Type Safety Improvement Script
# This script helps identify and fix 'any' type usage

echo "🔍 TypeScript Type Safety Analysis"
echo "=================================="

cd /Users/michaelyu/Project/browser-based-automated-testing-tools

# 1. Find all 'any' type usages
echo "📊 Current 'any' type usage:"
echo ""

echo "🔍 In shared/src/:"
grep -rn ": any\|<any>" shared/src/ 2>/dev/null | head -10

echo ""
echo "🔍 In web-app/src/:"
grep -rn ": any\|<any>" web-app/src/ 2>/dev/null | head -10

echo ""
echo "🔍 In extension/src/:"
grep -rn ": any\|<any>" extension/src/ 2>/dev/null | head -10

echo ""
echo "📈 Total count by directory:"
echo "shared/src: $(grep -r ": any\|<any>" shared/src/ 2>/dev/null | wc -l) instances"
echo "web-app/src: $(grep -r ": any\|<any>" web-app/src/ 2>/dev/null | wc -l) instances"
echo "extension/src: $(grep -r ": any\|<any>" extension/src/ 2>/dev/null | wc -l) instances"

# 2. Check TypeScript configuration
echo ""
echo "⚙️ TypeScript Configuration Check:"
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
    if grep -q "noImplicitAny.*true" tsconfig.json; then
        echo "✅ noImplicitAny is enabled"
    else
        echo "⚠️  noImplicitAny should be enabled"
    fi
else
    echo "❌ tsconfig.json not found"
fi

# 3. Run TypeScript compiler check
echo ""
echo "🏗️ TypeScript Compilation Check:"
if command -v tsc >/dev/null 2>&1; then
    echo "Running TypeScript compiler..."
    npx tsc --noEmit --skipLibCheck false 2>&1 | head -20
else
    echo "TypeScript compiler not found. Installing..."
    npm install -g typescript
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Review the 'any' types listed above"
echo "2. Replace with proper type definitions"
echo "3. Use 'unknown' type for truly dynamic content"
echo "4. Add interface definitions for complex objects"
echo "5. Enable strict mode in tsconfig.json"