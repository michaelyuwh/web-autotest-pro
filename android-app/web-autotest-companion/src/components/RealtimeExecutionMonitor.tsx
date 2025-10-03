import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TestExecution } from '../types';

interface RealtimeExecutionMonitorProps {
  activeExecutions: TestExecution[];
  onExecutionPress?: (execution: TestExecution) => void;
  onStopExecution?: (executionId: string) => void;
}

const RealtimeExecutionMonitor: React.FC<RealtimeExecutionMonitorProps> = ({
  activeExecutions,
  onExecutionPress,
  onStopExecution,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#007BFF';
      case 'pending': return '#ffc107';
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getProgressPercentage = (execution: TestExecution) => {
    if (execution.steps.length === 0) return 0;
    
    const completedSteps = execution.steps.filter(
      step => step.status === 'completed' || step.status === 'failed'
    ).length;
    
    return Math.round((completedSteps / execution.steps.length) * 100);
  };

  const getCurrentStepInfo = (execution: TestExecution) => {
    const currentStep = execution.steps.find(step => step.status === 'running');
    if (currentStep) {
      return {
        stepName: `Step ${currentStep.id}`,
        stepIndex: execution.steps.indexOf(currentStep) + 1,
        totalSteps: execution.steps.length
      };
    }
    return null;
  };

  const getExecutionDuration = (execution: TestExecution) => {
    const start = new Date(execution.startTime).getTime();
    const end = execution.endTime ? new Date(execution.endTime).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    }
  };

  if (activeExecutions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle-outline" size={48} color="#28a745" />
        <Text style={styles.emptyText}>No active executions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={20} color="#007BFF" />
        <Text style={styles.headerText}>Live Executions</Text>
        <Text style={styles.countBadge}>{activeExecutions.length}</Text>
      </View>
      
      <ScrollView style={styles.executionsList} showsVerticalScrollIndicator={false}>
        {activeExecutions.map((execution) => (
          <TouchableOpacity
            key={execution.id}
            style={styles.executionCard}
            onPress={() => onExecutionPress?.(execution)}
          >
            <View style={styles.executionHeader}>
              <View style={styles.statusContainer}>
                <View 
                  style={[
                    styles.statusIndicator, 
                    { backgroundColor: getStatusColor(execution.status) }
                  ]} 
                />
                <Text style={styles.executionId}>#{execution.id.slice(-6)}</Text>
              </View>
              
              {execution.status === 'running' && onStopExecution && (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={() => onStopExecution(execution.id)}
                >
                  <Ionicons name="stop" size={16} color="#dc3545" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.testCaseId}>
              Test Case: {execution.testCaseId}
            </Text>

            {execution.browser && (
              <Text style={styles.browserText}>
                Browser: {execution.browser}
              </Text>
            )}

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${getProgressPercentage(execution)}%`,
                      backgroundColor: getStatusColor(execution.status)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {getProgressPercentage(execution)}%
              </Text>
            </View>

            <View style={styles.executionFooter}>
              <Text style={styles.durationText}>
                Duration: {getExecutionDuration(execution)}
              </Text>
              <Text style={styles.stepsText}>
                Steps: {execution.steps.filter(s => s.status === 'completed').length}/{execution.steps.length}
              </Text>
            </View>

            {execution.steps.length > 0 && (
              <View style={styles.currentStepContainer}>
                <Text style={styles.currentStepLabel}>Current Step:</Text>
                <Text style={styles.currentStepText}>
                  {execution.steps.find(s => s.status === 'running')?.actionId || 
                   execution.steps[execution.steps.length - 1]?.actionId || 'Unknown'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: '#333',
  },
  countBadge: {
    backgroundColor: '#007BFF',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  executionsList: {
    maxHeight: 400,
  },
  executionCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  executionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  executionId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stopButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  testCaseId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  browserText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
  },
  executionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 12,
    color: '#666',
  },
  stepsText: {
    fontSize: 12,
    color: '#666',
  },
  currentStepContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    flexDirection: 'row',
  },
  currentStepLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    marginRight: 4,
  },
  currentStepText: {
    fontSize: 12,
    color: '#007BFF',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});

export default RealtimeExecutionMonitor;