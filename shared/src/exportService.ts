// Enhanced Export Service with comprehensive format support
// Supports PDF, HTML, JSON, CSV, Markdown, and XML export formats

import jsPDF from 'jspdf';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import { TestCase, TestExecution, TestAction, ExecutionStep } from './types';

export interface ReportExportOptions {
  format: 'pdf' | 'html' | 'json' | 'csv' | 'markdown' | 'xml';
  includeScreenshots?: boolean;
  includeSteps?: boolean;
  includeLogs?: boolean;
  customStyles?: string;
  fileName?: string;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  fileName: string;
  mimeType: string;
  error?: string;
}

export class ExportService {
  /**
   * Export test execution results in specified format
   */
  static async exportExecution(
    execution: TestExecution,
    testCase: TestCase,
    options: ReportExportOptions
  ): Promise<ExportResult> {
    try {
      const fileName = options.fileName || `test-report-${execution.id}-${Date.now()}`;
      
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(execution, testCase, options, fileName);
        case 'html':
          return await this.exportToHTML(execution, testCase, options, fileName);
        case 'json':
          return this.exportToJSON(execution, testCase, options, fileName);
        case 'csv':
          return this.exportToCSV(execution, testCase, options, fileName);
        case 'markdown':
          return this.exportToMarkdown(execution, testCase, options, fileName);
        case 'xml':
          return this.exportToXML(execution, testCase, options, fileName);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        fileName: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export multiple executions in batch
   */
  static async exportBatch(
    executions: TestExecution[],
    testCases: TestCase[],
    options: ReportExportOptions
  ): Promise<ExportResult> {
    const fileName = options.fileName || `batch-report-${Date.now()}`;
    
    switch (options.format) {
      case 'pdf':
        return await this.exportBatchToPDF(executions, testCases, options, fileName);
      case 'csv':
        return this.exportBatchToCSV(executions, testCases, options, fileName);
      case 'json':
        return this.exportBatchToJSON(executions, testCases, options, fileName);
      default:
        // For other formats, combine individual exports
        return await this.exportCombined(executions, testCases, options, fileName);
    }
  }

  // PDF Export Implementation
  private static async exportToPDF(
    execution: TestExecution,
    testCase: TestCase,
    options: ReportExportOptions,
    fileName: string
  ): Promise<ExportResult> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Web AutoTest Pro - Test Execution Report', 20, yPosition);
    yPosition += 15;

    // Test Case Information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Test Case: ${testCase.name}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Description: ${testCase.description || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Execution ID: ${execution.id}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Status: ${execution.status}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Start Time: ${new Date(execution.startTime).toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    if (execution.endTime) {
      pdf.text(`End Time: ${new Date(execution.endTime).toLocaleString()}`, 20, yPosition);
      yPosition += 8;
      const duration = execution.endTime - execution.startTime;
      pdf.text(`Duration: ${this.formatDuration(duration)}`, 20, yPosition);
      yPosition += 8;
    }

    // Summary Statistics
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', 20, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    
    const totalSteps = execution.steps?.length || 0;
    const passedSteps = execution.steps?.filter(step => step.status === 'passed').length || 0;
    const failedSteps = execution.steps?.filter(step => step.status === 'failed').length || 0;
    const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';

    pdf.text(`Total Steps: ${totalSteps}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Passed: ${passedSteps}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Failed: ${failedSteps}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Success Rate: ${successRate}%`, 20, yPosition);
    yPosition += 15;

    // Steps Details
    if (options.includeSteps && execution.steps) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Execution Steps', 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');

      for (let i = 0; i < execution.steps.length; i++) {
        const step = execution.steps[i];
        
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        // Step header
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Step ${i + 1}: ${step.action?.type || 'Unknown'}`, 20, yPosition);
        yPosition += 6;

        // Step details
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Status: ${step.status}`, 25, yPosition);
        yPosition += 5;
        
        if (step.action?.selector) {
          pdf.text(`Selector: ${step.action.selector}`, 25, yPosition);
          yPosition += 5;
        }
        
        if (step.action?.value) {
          pdf.text(`Value: ${step.action.value}`, 25, yPosition);
          yPosition += 5;
        }
        
        if (step.duration) {
          pdf.text(`Duration: ${step.duration}ms`, 25, yPosition);
          yPosition += 5;
        }
        
        if (step.error) {
          pdf.setTextColor(255, 0, 0);
          const errorLines = pdf.splitTextToSize(`Error: ${step.error}`, pageWidth - 50);
          pdf.text(errorLines, 25, yPosition);
          yPosition += errorLines.length * 5;
          pdf.setTextColor(0, 0, 0);
        }
        
        yPosition += 5;
      }
    }

    // Screenshots
    if (options.includeScreenshots && execution.screenshots) {
      yPosition += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Screenshots', 20, yPosition);
      yPosition += 8;

      for (const screenshot of execution.screenshots) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 20;
        }

        try {
          // Add screenshot to PDF (simplified - actual implementation would need proper image handling)
          pdf.text(`Screenshot: ${screenshot.id}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`Timestamp: ${new Date(screenshot.timestamp).toLocaleString()}`, 20, yPosition);
          yPosition += 15;
        } catch (error) {
          console.warn('Failed to add screenshot to PDF:', error);
        }
      }
    }

    const pdfBlob = pdf.output('blob');
    
    return {
      success: true,
      data: pdfBlob,
      fileName: `${fileName}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  // CSV Export Implementation
  private static exportToCSV(
    execution: TestExecution,
    testCase: TestCase,
    options: ReportExportOptions,
    fileName: string
  ): ExportResult {
    const csvData = [];

    // Header row
    csvData.push([
      'Test Case',
      'Execution ID',
      'Status',
      'Start Time',
      'End Time',
      'Duration (ms)',
      'Step Number',
      'Step Type',
      'Step Status',
      'Selector',
      'Value',
      'Step Duration (ms)',
      'Error'
    ]);

    // Data rows
    if (execution.steps) {
      execution.steps.forEach((step, index) => {
        csvData.push([
          testCase.name,
          execution.id,
          execution.status,
          new Date(execution.startTime).toISOString(),
          execution.endTime ? new Date(execution.endTime).toISOString() : '',
          execution.endTime ? execution.endTime - execution.startTime : '',
          index + 1,
          step.action?.type || '',
          step.status,
          step.action?.selector || '',
          step.action?.value || '',
          step.duration || '',
          step.error || ''
        ]);
      });
    } else {
      // Single row for execution without steps
      csvData.push([
        testCase.name,
        execution.id,
        execution.status,
        new Date(execution.startTime).toISOString(),
        execution.endTime ? new Date(execution.endTime).toISOString() : '',
        execution.endTime ? execution.endTime - execution.startTime : '',
        '', '', '', '', '', '', ''
      ]);
    }

    const csv = Papa.unparse(csvData);
    
    return {
      success: true,
      data: csv,
      fileName: `${fileName}.csv`,
      mimeType: 'text/csv'
    };
  }

  // Markdown Export Implementation
  private static exportToMarkdown(
    execution: TestExecution,
    testCase: TestCase,
    options: ReportExportOptions,
    fileName: string
  ): ExportResult {
    let markdown = '';

    // Header
    markdown += `# Web AutoTest Pro - Test Execution Report\n\n`;
    markdown += `**Generated on:** ${new Date().toLocaleString()}\n\n`;

    // Test Case Information
    markdown += `## Test Case Information\n\n`;
    markdown += `- **Name:** ${testCase.name}\n`;
    markdown += `- **Description:** ${testCase.description || 'N/A'}\n`;
    markdown += `- **URL:** ${testCase.url || 'N/A'}\n\n`;

    // Execution Information
    markdown += `## Execution Details\n\n`;
    markdown += `- **Execution ID:** ${execution.id}\n`;
    markdown += `- **Status:** ${execution.status}\n`;
    markdown += `- **Start Time:** ${new Date(execution.startTime).toLocaleString()}\n`;
    if (execution.endTime) {
      markdown += `- **End Time:** ${new Date(execution.endTime).toLocaleString()}\n`;
      markdown += `- **Duration:** ${this.formatDuration(execution.endTime - execution.startTime)}\n`;
    }
    markdown += `- **Browser:** ${execution.browser || 'Unknown'}\n\n`;

    // Summary Statistics
    const totalSteps = execution.steps?.length || 0;
    const passedSteps = execution.steps?.filter(step => step.status === 'passed').length || 0;
    const failedSteps = execution.steps?.filter(step => step.status === 'failed').length || 0;
    const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';

    markdown += `## Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Steps | ${totalSteps} |\n`;
    markdown += `| Passed Steps | ${passedSteps} |\n`;
    markdown += `| Failed Steps | ${failedSteps} |\n`;
    markdown += `| Success Rate | ${successRate}% |\n\n`;

    // Steps Details
    if (options.includeSteps && execution.steps) {
      markdown += `## Execution Steps\n\n`;
      
      execution.steps.forEach((step, index) => {
        markdown += `### Step ${index + 1}: ${step.action?.type || 'Unknown'}\n\n`;
        markdown += `- **Status:** ${step.status}\n`;
        if (step.action?.selector) {
          markdown += `- **Selector:** \`${step.action.selector}\`\n`;
        }
        if (step.action?.value) {
          markdown += `- **Value:** ${step.action.value}\n`;
        }
        if (step.duration) {
          markdown += `- **Duration:** ${step.duration}ms\n`;
        }
        if (step.error) {
          markdown += `- **Error:** \`${step.error}\`\n`;
        }
        markdown += `\n`;
      });
    }

    // Screenshots
    if (options.includeScreenshots && execution.screenshots) {
      markdown += `## Screenshots\n\n`;
      execution.screenshots.forEach((screenshot, index) => {
        markdown += `### Screenshot ${index + 1}\n\n`;
        markdown += `- **ID:** ${screenshot.id}\n`;
        markdown += `- **Timestamp:** ${new Date(screenshot.timestamp).toLocaleString()}\n`;
        markdown += `- **Type:** ${screenshot.type || 'action'}\n\n`;
      });
    }

    return {
      success: true,
      data: markdown,
      fileName: `${fileName}.md`,
      mimeType: 'text/markdown'
    };
  }

  // XML Export Implementation
  private static exportToXML(
    execution: TestExecution,
    testCase: TestCase,
    options: ReportExportOptions,
    fileName: string
  ): ExportResult {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testExecutionReport>\n';
    
    // Metadata
    xml += '  <metadata>\n';
    xml += `    <generatedDate>${new Date().toISOString()}</generatedDate>\n`;
    xml += '    <tool>Web AutoTest Pro</tool>\n';
    xml += '    <version>1.0.0</version>\n';
    xml += '  </metadata>\n';

    // Test Case
    xml += '  <testCase>\n';
    xml += `    <id>${this.escapeXml(testCase.id)}</id>\n`;
    xml += `    <name>${this.escapeXml(testCase.name)}</name>\n`;
    xml += `    <description>${this.escapeXml(testCase.description || '')}</description>\n`;
    xml += `    <url>${this.escapeXml(testCase.url || '')}</url>\n`;
    xml += '  </testCase>\n';

    // Execution
    xml += '  <execution>\n';
    xml += `    <id>${this.escapeXml(execution.id)}</id>\n`;
    xml += `    <status>${this.escapeXml(execution.status)}</status>\n`;
    xml += `    <startTime>${new Date(execution.startTime).toISOString()}</startTime>\n`;
    if (execution.endTime) {
      xml += `    <endTime>${new Date(execution.endTime).toISOString()}</endTime>\n`;
      xml += `    <duration>${execution.endTime - execution.startTime}</duration>\n`;
    }
    xml += `    <browser>${this.escapeXml(execution.browser || '')}</browser>\n`;

    // Steps
    if (options.includeSteps && execution.steps) {
      xml += '    <steps>\n';
      execution.steps.forEach((step, index) => {
        xml += `      <step number="${index + 1}">\n`;
        xml += `        <status>${this.escapeXml(step.status)}</status>\n`;
        if (step.action) {
          xml += '        <action>\n';
          xml += `          <type>${this.escapeXml(step.action.type)}</type>\n`;
          if (step.action.selector) {
            xml += `          <selector>${this.escapeXml(step.action.selector)}</selector>\n`;
          }
          if (step.action.value) {
            xml += `          <value>${this.escapeXml(step.action.value)}</value>\n`;
          }
          xml += '        </action>\n';
        }
        if (step.duration) {
          xml += `        <duration>${step.duration}</duration>\n`;
        }
        if (step.error) {
          xml += `        <error>${this.escapeXml(step.error)}</error>\n`;
        }
        xml += '      </step>\n';
      });
      xml += '    </steps>\n';
    }

    // Screenshots
    if (options.includeScreenshots && execution.screenshots) {
      xml += '    <screenshots>\n';
      execution.screenshots.forEach((screenshot, index) => {
        xml += `      <screenshot index="${index}">\n`;
        xml += `        <id>${this.escapeXml(screenshot.id)}</id>\n`;
        xml += `        <timestamp>${new Date(screenshot.timestamp).toISOString()}</timestamp>\n`;
        xml += `        <type>${this.escapeXml(screenshot.type || 'action')}</type>\n`;
        xml += '      </screenshot>\n';
      });
      xml += '    </screenshots>\n';
    }

    xml += '  </execution>\n';
    xml += '</testExecutionReport>\n';

    return {
      success: true,
      data: xml,
      fileName: `${fileName}.xml`,
      mimeType: 'application/xml'
    };
  }

  // HTML Export Implementation
  private static async exportToHTML(
    execution: TestExecution,
    testCase: TestCase,
    options: ReportExportOptions,
    fileName: string
  ): Promise<ExportResult> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report - ${testCase.name}</title>
    <style>
        ${options.customStyles || this.getDefaultHTMLStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Web AutoTest Pro - Test Execution Report</h1>
            <p class="generated-date">Generated on: ${new Date().toLocaleString()}</p>
        </header>

        <section class="test-info">
            <h2>Test Case Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Name:</label>
                    <span>${testCase.name}</span>
                </div>
                <div class="info-item">
                    <label>Description:</label>
                    <span>${testCase.description || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>URL:</label>
                    <span>${testCase.url || 'N/A'}</span>
                </div>
            </div>
        </section>

        <section class="execution-info">
            <h2>Execution Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Execution ID:</label>
                    <span>${execution.id}</span>
                </div>
                <div class="info-item">
                    <label>Status:</label>
                    <span class="status ${execution.status}">${execution.status}</span>
                </div>
                <div class="info-item">
                    <label>Start Time:</label>
                    <span>${new Date(execution.startTime).toLocaleString()}</span>
                </div>
                ${execution.endTime ? `
                <div class="info-item">
                    <label>End Time:</label>
                    <span>${new Date(execution.endTime).toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <label>Duration:</label>
                    <span>${this.formatDuration(execution.endTime - execution.startTime)}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <label>Browser:</label>
                    <span>${execution.browser || 'Unknown'}</span>
                </div>
            </div>
        </section>

        ${this.generateHTMLSummary(execution)}
        ${options.includeSteps ? this.generateHTMLSteps(execution) : ''}
        ${options.includeScreenshots ? this.generateHTMLScreenshots(execution) : ''}
    </div>
</body>
</html>`;

    return {
      success: true,
      data: html,
      fileName: `${fileName}.html`,
      mimeType: 'text/html'
    };
  }

  // JSON Export Implementation
  private static exportToJSON(
    execution: TestExecution,
    testCase: TestCase,
    options: ReportExportOptions,
    fileName: string
  ): ExportResult {
    const exportData = {
      metadata: {
        tool: 'Web AutoTest Pro',
        version: '1.0.0',
        generatedDate: new Date().toISOString(),
        options
      },
      testCase: {
        id: testCase.id,
        name: testCase.name,
        description: testCase.description,
        url: testCase.url,
        actions: testCase.actions
      },
      execution: {
        id: execution.id,
        testCaseId: execution.testCaseId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        browser: execution.browser,
        steps: options.includeSteps ? execution.steps : undefined,
        screenshots: options.includeScreenshots ? execution.screenshots : undefined,
        logs: options.includeLogs ? execution.logs : undefined,
        results: execution.results,
        videos: execution.videos
      },
      summary: {
        totalSteps: execution.steps?.length || 0,
        passedSteps: execution.steps?.filter(step => step.status === 'passed').length || 0,
        failedSteps: execution.steps?.filter(step => step.status === 'failed').length || 0,
        successRate: execution.steps?.length ? 
          ((execution.steps.filter(step => step.status === 'passed').length / execution.steps.length) * 100).toFixed(1) : 
          '0'
      }
    };

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2),
      fileName: `${fileName}.json`,
      mimeType: 'application/json'
    };
  }

  // Batch export implementations
  private static async exportBatchToPDF(
    executions: TestExecution[],
    testCases: TestCase[],
    options: ReportExportOptions,
    fileName: string
  ): Promise<ExportResult> {
    // Combine multiple executions into a single PDF
    const pdf = new jsPDF();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Web AutoTest Pro - Batch Test Report', 20, yPosition);
    yPosition += 20;

    // Summary table
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Executions: ${executions.length}`, 20, yPosition);
    yPosition += 8;

    const passed = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    
    pdf.text(`Passed: ${passed}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Failed: ${failed}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Success Rate: ${((passed / executions.length) * 100).toFixed(1)}%`, 20, yPosition);
    yPosition += 15;

    // Individual execution summaries
    for (const execution of executions) {
      const testCase = testCases.find(tc => tc.id === execution.testCaseId);
      if (!testCase) continue;

      if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text(`${testCase.name}`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${execution.status}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Duration: ${execution.endTime ? this.formatDuration(execution.endTime - execution.startTime) : 'N/A'}`, 25, yPosition);
      yPosition += 10;
    }

    const pdfBlob = pdf.output('blob');
    
    return {
      success: true,
      data: pdfBlob,
      fileName: `${fileName}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  private static exportBatchToCSV(
    executions: TestExecution[],
    testCases: TestCase[],
    options: ReportExportOptions,
    fileName: string
  ): ExportResult {
    const csvData = [];
    
    // Header
    csvData.push([
      'Test Case Name',
      'Execution ID',
      'Status',
      'Start Time',
      'End Time',
      'Duration (ms)',
      'Steps Count',
      'Passed Steps',
      'Failed Steps',
      'Success Rate (%)'
    ]);

    // Data rows
    executions.forEach(execution => {
      const testCase = testCases.find(tc => tc.id === execution.testCaseId);
      if (!testCase) return;

      const totalSteps = execution.steps?.length || 0;
      const passedSteps = execution.steps?.filter(step => step.status === 'passed').length || 0;
      const failedSteps = execution.steps?.filter(step => step.status === 'failed').length || 0;
      const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';

      csvData.push([
        testCase.name,
        execution.id,
        execution.status,
        new Date(execution.startTime).toISOString(),
        execution.endTime ? new Date(execution.endTime).toISOString() : '',
        execution.endTime ? execution.endTime - execution.startTime : '',
        totalSteps,
        passedSteps,
        failedSteps,
        successRate
      ]);
    });

    const csv = Papa.unparse(csvData);
    
    return {
      success: true,
      data: csv,
      fileName: `${fileName}.csv`,
      mimeType: 'text/csv'
    };
  }

  private static exportBatchToJSON(
    executions: TestExecution[],
    testCases: TestCase[],
    options: ReportExportOptions,
    fileName: string
  ): ExportResult {
    const batchData = {
      metadata: {
        tool: 'Web AutoTest Pro',
        version: '1.0.0',
        generatedDate: new Date().toISOString(),
        totalExecutions: executions.length,
        options
      },
      summary: {
        totalExecutions: executions.length,
        passed: executions.filter(e => e.status === 'completed').length,
        failed: executions.filter(e => e.status === 'failed').length,
        successRate: ((executions.filter(e => e.status === 'completed').length / executions.length) * 100).toFixed(1)
      },
      executions: executions.map(execution => {
        const testCase = testCases.find(tc => tc.id === execution.testCaseId);
        return {
          testCase: testCase ? {
            id: testCase.id,
            name: testCase.name,
            description: testCase.description
          } : null,
          execution: {
            id: execution.id,
            status: execution.status,
            startTime: execution.startTime,
            endTime: execution.endTime,
            browser: execution.browser,
            stepsSummary: {
              total: execution.steps?.length || 0,
              passed: execution.steps?.filter(step => step.status === 'passed').length || 0,
              failed: execution.steps?.filter(step => step.status === 'failed').length || 0
            },
            steps: options.includeSteps ? execution.steps : undefined,
            screenshots: options.includeScreenshots ? execution.screenshots : undefined
          }
        };
      })
    };

    return {
      success: true,
      data: JSON.stringify(batchData, null, 2),
      fileName: `${fileName}.json`,
      mimeType: 'application/json'
    };
  }

  private static async exportCombined(
    executions: TestExecution[],
    testCases: TestCase[],
    options: ReportExportOptions,
    fileName: string
  ): Promise<ExportResult> {
    // For formats that don't have specific batch implementations,
    // combine individual exports
    const combinedResults = [];
    
    for (const execution of executions) {
      const testCase = testCases.find(tc => tc.id === execution.testCaseId);
      if (testCase) {
        const result = await this.exportExecution(execution, testCase, {
          ...options,
          fileName: `${execution.id}`
        });
        if (result.success && result.data) {
          combinedResults.push({
            fileName: result.fileName,
            data: result.data
          });
        }
      }
    }

    // For now, return the first result (could be enhanced to create zip files)
    if (combinedResults.length > 0) {
      return {
        success: true,
        data: combinedResults[0].data,
        fileName: `${fileName}-combined.${options.format}`,
        mimeType: this.getMimeType(options.format)
      };
    }

    return {
      success: false,
      fileName: '',
      mimeType: '',
      error: 'No valid executions to export'
    };
  }

  // Helper methods
  private static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      html: 'text/html',
      json: 'application/json',
      csv: 'text/csv',
      markdown: 'text/markdown',
      xml: 'application/xml'
    };
    return mimeTypes[format] || 'text/plain';
  }

  private static getDefaultHTMLStyles(): string {
    return `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
      .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
      h1 { color: #333; margin: 0; }
      h2 { color: #555; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
      .generated-date { color: #666; margin: 10px 0 0 0; }
      .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
      .info-item { display: flex; }
      .info-item label { font-weight: bold; min-width: 120px; color: #555; }
      .status { padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; text-transform: uppercase; }
      .status.completed { background: #28a745; }
      .status.failed { background: #dc3545; }
      .status.running { background: #007bff; }
      .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
      .stat-card { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
      .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
      .stat-label { color: #666; margin-top: 5px; }
      .steps-list { margin: 20px 0; }
      .step-item { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff; }
      .step-item.failed { border-left-color: #dc3545; }
      .step-header { font-weight: bold; margin-bottom: 10px; }
      .step-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 14px; color: #666; }
      .error-message { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 4px; margin-top: 10px; }
    `;
  }

  private static generateHTMLSummary(execution: TestExecution): string {
    const totalSteps = execution.steps?.length || 0;
    const passedSteps = execution.steps?.filter(step => step.status === 'passed').length || 0;
    const failedSteps = execution.steps?.filter(step => step.status === 'failed').length || 0;
    const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';

    return `
      <section class="summary">
        <h2>Summary</h2>
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-value">${totalSteps}</div>
            <div class="stat-label">Total Steps</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #28a745;">${passedSteps}</div>
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #dc3545;">${failedSteps}</div>
            <div class="stat-label">Failed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${successRate}%</div>
            <div class="stat-label">Success Rate</div>
          </div>
        </div>
      </section>
    `;
  }

  private static generateHTMLSteps(execution: TestExecution): string {
    if (!execution.steps) return '';

    let stepsHTML = '<section class="steps"><h2>Execution Steps</h2><div class="steps-list">';
    
    execution.steps.forEach((step, index) => {
      const statusClass = step.status === 'failed' ? 'failed' : '';
      stepsHTML += `
        <div class="step-item ${statusClass}">
          <div class="step-header">Step ${index + 1}: ${step.action?.type || 'Unknown'}</div>
          <div class="step-details">
            <div><strong>Status:</strong> ${step.status}</div>
            ${step.action?.selector ? `<div><strong>Selector:</strong> <code>${step.action.selector}</code></div>` : ''}
            ${step.action?.value ? `<div><strong>Value:</strong> ${step.action.value}</div>` : ''}
            ${step.duration ? `<div><strong>Duration:</strong> ${step.duration}ms</div>` : ''}
          </div>
          ${step.error ? `<div class="error-message"><strong>Error:</strong> ${step.error}</div>` : ''}
        </div>
      `;
    });
    
    stepsHTML += '</div></section>';
    return stepsHTML;
  }

  private static generateHTMLScreenshots(execution: TestExecution): string {
    if (!execution.screenshots || execution.screenshots.length === 0) return '';

    let screenshotsHTML = '<section class="screenshots"><h2>Screenshots</h2><div class="screenshots-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">';
    
    execution.screenshots.forEach((screenshot, index) => {
      screenshotsHTML += `
        <div class="screenshot-item" style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="padding: 10px; background: #f8f9fa;">
            <div style="font-weight: bold;">Screenshot ${index + 1}</div>
            <div style="font-size: 12px; color: #666;">${new Date(screenshot.timestamp).toLocaleString()}</div>
            <div style="font-size: 12px; color: #666;">Type: ${screenshot.type || 'action'}</div>
          </div>
        </div>
      `;
    });
    
    screenshotsHTML += '</div></section>';
    return screenshotsHTML;
  }
}