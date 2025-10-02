import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStats, SyncStatus } from '../types';
import { useRealtimeMonitoring } from '../hooks/useRealtimeMonitoring';
import RealtimeExecutionMonitor from '../components/RealtimeExecutionMonitor';

const DashboardScreen = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTestCases: 0,
    recentExecutions: 0,
    successRate: 0,
    activeTests: 0,
  });
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    lastSync: new Date(),
    pendingChanges: 0,
  });
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Real-time monitoring
  const { isConnected, activeExecutions, connectionError } = useRealtimeMonitoring({
    onExecutionComplete: (execution) => {
      console.log('Execution completed:', execution.id);
      loadDashboardData(); // Refresh stats
    },
    onExecutionError: (execution, error) => {
      console.log('Execution failed:', execution.id, error);
      loadDashboardData(); // Refresh stats
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data for now - would fetch from API
      setStats({
        totalTestCases: 15,
        recentExecutions: 8,
        successRate: 87.5,
        activeTests: 2,
      });
      
      setSyncStatus({
        connected: isConnected,
        lastSync: new Date(),
        pendingChanges: Math.floor(Math.random() * 5),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const connectToWebApp = () => {
    Alert.alert(
      'Connect to Web App',
      'Would you like to connect to the Web AutoTest Pro application?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect', onPress: () => console.log('Navigate to connection') },
      ]
    );
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = '#007BFF' 
  }: { 
    title: string; 
    value: string | number; 
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Real-time Executions Monitor */}
      {activeExecutions.length > 0 && (
        <RealtimeExecutionMonitor
          activeExecutions={activeExecutions}
          onExecutionPress={(execution) => {
            console.log('Navigate to execution details:', execution.id);
          }}
        />
      )}

      {/* Connection Status */}
      <View style={[
        styles.connectionCard, 
        { backgroundColor: syncStatus.connected ? '#d4edda' : '#f8d7da' }
      ]}>
        <View style={styles.connectionHeader}>
          <Ionicons 
            name={syncStatus.connected ? 'checkmark-circle' : 'close-circle'} 
            size={24} 
            color={syncStatus.connected ? '#155724' : '#721c24'} 
          />
          <Text style={[
            styles.connectionStatus,
            { color: syncStatus.connected ? '#155724' : '#721c24' }
          ]}>
            {syncStatus.connected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        <Text style={styles.lastSync}>
          Last sync: {syncStatus.lastSync.toLocaleTimeString()}
        </Text>
        {syncStatus.pendingChanges > 0 && (
          <Text style={styles.pendingChanges}>
            {syncStatus.pendingChanges} pending changes
          </Text>
        )}
        {!syncStatus.connected && (
          <TouchableOpacity style={styles.connectButton} onPress={connectToWebApp}>
            <Text style={styles.connectButtonText}>Connect to Web App</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Statistics */}
      <Text style={styles.sectionTitle}>Overview</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="Test Cases"
          value={stats.totalTestCases}
          icon="list"
          color="#007BFF"
        />
        <StatCard
          title="Recent Executions"
          value={stats.recentExecutions}
          icon="play"
          color="#28a745"
        />
      </View>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon="trophy"
          color="#ffc107"
        />
        <StatCard
          title="Active Tests"
          value={stats.activeTests}
          icon="pulse"
          color="#dc3545"
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="add-circle" size={24} color="#007BFF" />
        <Text style={styles.actionButtonText}>Create New Test</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="play" size={24} color="#28a745" />
        <Text style={styles.actionButtonText}>Run Test Suite</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="analytics" size={24} color="#ffc107" />
        <Text style={styles.actionButtonText}>View Reports</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  connectionCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  connectionStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  lastSync: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pendingChanges: {
    fontSize: 14,
    color: '#ffc107',
    marginBottom: 8,
  },
  connectButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
});

export default DashboardScreen;