# CI/CD Integration Guide

This guide covers integrating Web AutoTest Pro with various CI/CD platforms and tools.

## GitHub Actions Integration

### Basic Workflow

Create `.github/workflows/automated-testing.yml`:

```yaml
name: Automated Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run tests daily at 2 AM UTC
    - cron: '0 2 * * *'

env:
  NODE_VERSION: '18'
  WEB_AUTOTEST_API_URL: ${{ secrets.WEB_AUTOTEST_API_URL }}
  WEB_AUTOTEST_API_KEY: ${{ secrets.WEB_AUTOTEST_API_KEY }}

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          CI: true
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: unit-test-results
          path: |
            coverage/
            test-results/

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    strategy:
      matrix:
        browser: [chrome, firefox]
        viewport: [desktop, tablet, mobile]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          BROWSER: ${{ matrix.browser }}
          VIEWPORT: ${{ matrix.viewport }}
          CI: true
      
      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: integration-test-results-${{ matrix.browser }}-${{ matrix.viewport }}
          path: |
            test-results/
            playwright-report/

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test --shard=${{ matrix.shard }}/4
        env:
          CI: true
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-test-results-${{ matrix.shard }}
          path: |
            test-results/
            playwright-report/

  accessibility-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run preview &
        
      - name: Wait for application
        run: npx wait-on http://localhost:4173
      
      - name: Run accessibility tests
        run: npm run test:accessibility
        env:
          CI: true
      
      - name: Upload accessibility report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: accessibility-report
          path: accessibility-report/

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium
      
      - name: Run OWASP ZAP scan
        run: |
          docker run -v $(pwd):/zap/wrk/:rw \
            -t owasp/zap2docker-stable zap-baseline.py \
            -t http://localhost:4173 \
            -J zap-report.json || true
      
      - name: Upload security reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-reports
          path: |
            zap-report.json
            snyk-report.json

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run preview &
        
      - name: Wait for application
        run: npx wait-on http://localhost:4173
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Upload performance reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: performance-reports
          path: |
            .lighthouseci/
            performance-report.json

  visual-regression-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run visual regression tests
        run: npm run test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
      
      - name: Upload visual diff reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: visual-regression-report
          path: visual-regression-report/

  test-report:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, accessibility-tests, security-tests, performance-tests, visual-regression-tests]
    if: always()
    steps:
      - uses: actions/checkout@v4
      
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: test-artifacts
      
      - name: Generate comprehensive report
        run: |
          node scripts/generate-test-report.js
        env:
          ARTIFACTS_PATH: test-artifacts
      
      - name: Upload comprehensive report
        uses: actions/upload-artifact@v4
        with:
          name: comprehensive-test-report
          path: comprehensive-report.html
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('test-summary.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: staging
          VITE_API_URL: ${{ secrets.STAGING_API_URL }}
      
      - name: Deploy to staging
        run: |
          # Deploy to your staging environment
          echo "Deploying to staging..."
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, accessibility-tests, security-tests, performance-tests]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          VITE_API_URL: ${{ secrets.PRODUCTION_API_URL }}
      
      - name: Deploy to production
        run: |
          # Deploy to your production environment
          echo "Deploying to production..."
      
      - name: Run post-deployment tests
        run: npm run test:smoke
        env:
          BASE_URL: ${{ secrets.PRODUCTION_URL }}
      
      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: "✅ Production deployment successful!"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Jenkins Integration

### Jenkinsfile

```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        WEB_AUTOTEST_API_URL = credentials('web-autotest-api-url')
        WEB_AUTOTEST_API_KEY = credentials('web-autotest-api-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup') {
            steps {
                sh 'nvm use ${NODE_VERSION}'
                sh 'npm ci'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/unit/*.xml'
                    publishCoverage adapters: [
                        istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')
                    ]
                }
            }
        }
        
        stage('Integration Tests') {
            parallel {
                stage('Chrome') {
                    steps {
                        sh 'BROWSER=chrome npm run test:integration'
                    }
                }
                stage('Firefox') {
                    steps {
                        sh 'BROWSER=firefox npm run test:integration'
                    }
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/integration/*.xml'
                    archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('E2E Tests') {
            steps {
                sh 'npm run test:e2e'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/e2e/*.xml'
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'npm audit --audit-level=moderate'
                sh 'npm run security:scan'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'security-report.xml'
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*'
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh 'npm run deploy:staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh 'npm run deploy:production'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend color: 'good', message: "✅ Build successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        }
        failure {
            slackSend color: 'danger', message: "❌ Build failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        }
    }
}
```

## GitLab CI Integration

### .gitlab-ci.yml

```yaml
stages:
  - test
  - security
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  PLAYWRIGHT_BROWSERS_PATH: $CI_PROJECT_DIR/.playwright

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .playwright/

before_script:
  - apt-get update -qq && apt-get install -y -qq git curl
  - curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  - export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  - nvm install $NODE_VERSION
  - nvm use $NODE_VERSION
  - npm ci

unit-tests:
  stage: test
  script:
    - npm run test:unit
  artifacts:
    reports:
      junit: test-results/unit/*.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 1 week

integration-tests:
  stage: test
  parallel:
    matrix:
      - BROWSER: [chrome, firefox]
        VIEWPORT: [desktop, tablet, mobile]
  script:
    - npx playwright install --with-deps $BROWSER
    - BROWSER=$BROWSER VIEWPORT=$VIEWPORT npm run test:integration
  artifacts:
    reports:
      junit: test-results/integration/*.xml
    paths:
      - test-results/
      - playwright-report/
    expire_in: 1 week

e2e-tests:
  stage: test
  parallel: 4
  script:
    - npx playwright install --with-deps
    - npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
  artifacts:
    reports:
      junit: test-results/e2e/*.xml
    paths:
      - test-results/
      - playwright-report/
    expire_in: 1 week

accessibility-tests:
  stage: test
  script:
    - npm run build
    - npm run preview &
    - npx wait-on http://localhost:4173
    - npm run test:accessibility
  artifacts:
    paths:
      - accessibility-report/
    expire_in: 1 week

security-scan:
  stage: security
  script:
    - npm audit --audit-level=moderate
    - npm run security:scan
  artifacts:
    reports:
      sast: security-report.json
    expire_in: 1 week

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

deploy-staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.webautotestpro.com
  script:
    - npm run deploy:staging
  only:
    - develop

deploy-production:
  stage: deploy
  environment:
    name: production
    url: https://webautotestpro.com
  script:
    - npm run deploy:production
  when: manual
  only:
    - main
```

## Azure DevOps Integration

### azure-pipelines.yml

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18'
  
stages:
- stage: Test
  displayName: 'Run Tests'
  jobs:
  - job: UnitTests
    displayName: 'Unit Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run test:unit
      displayName: 'Run unit tests'
    
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'test-results/unit/*.xml'
    
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: 'coverage/cobertura-coverage.xml'

  - job: IntegrationTests
    displayName: 'Integration Tests'
    strategy:
      matrix:
        Chrome:
          browserName: 'chrome'
        Firefox:
          browserName: 'firefox'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npx playwright install --with-deps $(browserName)
      displayName: 'Install browsers'
    
    - script: BROWSER=$(browserName) npm run test:integration
      displayName: 'Run integration tests'
    
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'test-results/integration/*.xml'

- stage: Security
  displayName: 'Security Scan'
  dependsOn: Test
  jobs:
  - job: SecurityScan
    displayName: 'Security Scan'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm audit --audit-level=moderate
      displayName: 'NPM Audit'
    
    - script: npm run security:scan
      displayName: 'Security scan'

- stage: Build
  displayName: 'Build Application'
  dependsOn: [Test, Security]
  jobs:
  - job: Build
    displayName: 'Build'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run build
      displayName: 'Build application'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'dist'
        artifactName: 'dist'

- stage: Deploy
  displayName: 'Deploy Application'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployProduction
    displayName: 'Deploy to Production'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: dist
          
          - script: echo "Deploy to production"
            displayName: 'Deploy application'
```

## Test Report Scripts

### scripts/generate-test-report.js

```javascript
const fs = require('fs');
const path = require('path');

function generateTestReport() {
  const artifactsPath = process.env.ARTIFACTS_PATH || 'test-artifacts';
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    },
    categories: {}
  };

  // Process unit test results
  if (fs.existsSync(path.join(artifactsPath, 'unit-test-results'))) {
    report.categories.unit = processJUnitResults(
      path.join(artifactsPath, 'unit-test-results')
    );
  }

  // Process integration test results
  if (fs.existsSync(path.join(artifactsPath, 'integration-test-results'))) {
    report.categories.integration = processJUnitResults(
      path.join(artifactsPath, 'integration-test-results')
    );
  }

  // Process E2E test results
  const e2eResults = [];
  for (let i = 1; i <= 4; i++) {
    const shardPath = path.join(artifactsPath, `e2e-test-results-${i}`);
    if (fs.existsSync(shardPath)) {
      e2eResults.push(processJUnitResults(shardPath));
    }
  }
  if (e2eResults.length > 0) {
    report.categories.e2e = mergeResults(e2eResults);
  }

  // Calculate totals
  Object.values(report.categories).forEach(category => {
    report.summary.total += category.total;
    report.summary.passed += category.passed;
    report.summary.failed += category.failed;
    report.summary.skipped += category.skipped;
  });

  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  fs.writeFileSync('comprehensive-report.html', htmlReport);

  // Generate markdown summary for PR comments
  const markdownSummary = generateMarkdownSummary(report);
  fs.writeFileSync('test-summary.md', markdownSummary);

  console.log('Test report generated successfully');
}

function processJUnitResults(resultsPath) {
  // Implementation to parse JUnit XML files
  // Return { total, passed, failed, skipped, details }
}

function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .skipped { color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Test Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total: ${report.summary.total}</p>
    <p class="passed">Passed: ${report.summary.passed}</p>
    <p class="failed">Failed: ${report.summary.failed}</p>
    <p class="skipped">Skipped: ${report.summary.skipped}</p>
    <p>Success Rate: ${((report.summary.passed / (report.summary.total - report.summary.skipped)) * 100).toFixed(2)}%</p>
  </div>
  
  <h2>Test Categories</h2>
  <table>
    <tr>
      <th>Category</th>
      <th>Total</th>
      <th>Passed</th>
      <th>Failed</th>
      <th>Skipped</th>
      <th>Success Rate</th>
    </tr>
    ${Object.entries(report.categories).map(([name, category]) => `
      <tr>
        <td>${name}</td>
        <td>${category.total}</td>
        <td class="passed">${category.passed}</td>
        <td class="failed">${category.failed}</td>
        <td class="skipped">${category.skipped}</td>
        <td>${((category.passed / (category.total - category.skipped)) * 100).toFixed(2)}%</td>
      </tr>
    `).join('')}
  </table>
  
  <p><small>Generated: ${report.timestamp}</small></p>
</body>
</html>
  `;
}

function generateMarkdownSummary(report) {
  return `
## 🧪 Test Results Summary

| Category | Total | ✅ Passed | ❌ Failed | ⏭️ Skipped | Success Rate |
|----------|-------|-----------|-----------|------------|--------------|
${Object.entries(report.categories).map(([name, category]) => 
  `| ${name} | ${category.total} | ${category.passed} | ${category.failed} | ${category.skipped} | ${((category.passed / (category.total - category.skipped)) * 100).toFixed(2)}% |`
).join('\n')}
| **Total** | **${report.summary.total}** | **${report.summary.passed}** | **${report.summary.failed}** | **${report.summary.skipped}** | **${((report.summary.passed / (report.summary.total - report.summary.skipped)) * 100).toFixed(2)}%** |

${report.summary.failed > 0 ? '⚠️ Some tests failed. Please review the detailed reports.' : '✅ All tests passed!'}

*Report generated: ${report.timestamp}*
  `;
}

generateTestReport();
```

This comprehensive CI/CD integration guide provides:

1. **GitHub Actions**: Complete workflow with parallel testing, multiple browsers, and deployment
2. **Jenkins**: Pipeline as code with parallel stages and artifact management
3. **GitLab CI**: YAML configuration with matrix builds and security scanning
4. **Azure DevOps**: Multi-stage pipeline with testing and deployment
5. **Test Reporting**: Automated report generation and PR commenting

The workflows cover all testing types (unit, integration, E2E, accessibility, security, performance, visual regression) and provide comprehensive reporting and deployment automation.