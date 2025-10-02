import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TestExecution } from '../types';
import { useRealtimeMonitoring } from '../hooks/useRealtimeMonitoring';
import RealtimeExecutionMonitor from '../components/RealtimeExecutionMonitor';

const ExecutionsScreen = () => {
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real-time monitoring
  const { activeExecutions, connectionError } = useRealtimeMonitoring({
    onExecutionComplete: (execution) => {
      // Add completed execution to history
      setExecutions(prev => [execution, ...prev]);
    },
    onExecutionError: (execution, error) => {
      // Add failed execution to history
      setExecutions(prev => [{ ...execution, error }, ...prev]);
    }
  });

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    // Mock executions data
    const mockExecutions: TestExecution[] = [
      {
        id: '1',
        testCaseId: '1',
        status: 'completed',
        startTime: new Date('2024-01-15T10:30:00'),
        endTime: new Date('2024-01-15T10:32:15'),
        steps: [],
        screenshots: [],
        browser: 'Chrome',
        executedBy: 'user@example.com',
      },
      {
        id: '2',
        testCaseId: '2',
        status: 'failed',
        startTime: new Date('2024-01-15T09:15:00'),
        endTime: new Date('2024-01-15T09:18:30'),
        steps: [],
        screenshots: [],
        error: 'Element not found: #submit-button',
        browser: 'Firefox',
        executedBy: 'user@example.com',
      },
      {
        id: '3',
        testCaseId: '1',
        status: 'running',
        startTime: new Date('2024-01-15T11:00:00'),
        steps: [],
        screenshots: [],
        browser: 'Chrome',
        executedBy: 'user@example.com',
      },
    ];
    
    setExecutions(mockExecutions);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExecutions();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      case 'running': return '#007BFF';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'running': return 'play-circle';
      default: return 'time';
    }
  };

  const renderExecution = ({ item }: { item: TestExecution }) => (
    <TouchableOpacity style={styles.executionCard}>
      <View style={styles.executionHeader}>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.executionId}>#{item.id}</Text>
      </View>
      
      <Text style={styles.testCaseId}>Test Case: {item.testCaseId}</Text>
      
      <View style={styles.executionDetails}>
        <Text style={styles.detailText}>
          Started: {item.startTime.toLocaleString()}
        </Text>
        {item.endTime && (
          <Text style={styles.detailText}>
            Ended: {item.endTime.toLocaleString()}
          </Text>
        )}
        <Text style={styles.detailText}>Browser: {item.browser}</Text>
      </View>
      
      {item.error && (
        <Text style={styles.errorText}>{item.error}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Real-time Active Executions */}
      <RealtimeExecutionMonitor
        activeExecutions={activeExecutions}
        onExecutionPress={(execution) => {
          console.log('Navigate to execution details:', execution.id);
        }}
      />
      
      {/* Historical Executions */}
      <FlatList
        data={executions}
        keyExtractor={(item) => item.id}
        renderItem={renderExecution}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No executions found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  executionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  executionId: {
    fontSize: 12,
    color: '#666',
  },
  testCaseId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  executionDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ExecutionsScreen;