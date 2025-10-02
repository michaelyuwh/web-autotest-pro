import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TestCase } from '../types';

const TestCasesScreen = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTestCases();
  }, []);

  useEffect(() => {
    filterTestCases();
  }, [searchQuery, testCases]);

  const loadTestCases = async () => {
    try {
      // Mock data - would fetch from API
      const mockTestCases: TestCase[] = [
        {
          id: '1',
          name: 'Login Flow Test',
          description: 'Test user login functionality',
          url: 'https://example.com/login',
          actions: [],
          created: new Date('2024-01-10'),
          modified: new Date('2024-01-15'),
          tags: ['login', 'authentication'],
        },
        {
          id: '2',
          name: 'E-commerce Checkout',
          description: 'Test complete purchase flow',
          url: 'https://shop.example.com',
          actions: [],
          created: new Date('2024-01-12'),
          modified: new Date('2024-01-14'),
          tags: ['checkout', 'payment'],
        },
        {
          id: '3',
          name: 'Contact Form Validation',
          description: 'Test form validation rules',
          url: 'https://example.com/contact',
          actions: [],
          created: new Date('2024-01-13'),
          modified: new Date('2024-01-13'),
          tags: ['forms', 'validation'],
        },
      ];
      
      setTestCases(mockTestCases);
    } catch (error) {
      console.error('Failed to load test cases:', error);
      Alert.alert('Error', 'Failed to load test cases');
    }
  };

  const filterTestCases = () => {
    if (searchQuery.trim() === '') {
      setFilteredTestCases(testCases);
    } else {
      const filtered = testCases.filter(testCase =>
        testCase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredTestCases(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTestCases();
    setRefreshing(false);
  };

  const handleTestCasePress = (testCase: TestCase) => {
    // Would navigate to TestCaseDetailScreen
    console.log('Navigate to test case:', testCase.id);
  };

  const handleRunTest = (testCase: TestCase) => {
    Alert.alert(
      'Run Test',
      `Do you want to run "${testCase.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Run', onPress: () => console.log('Run test:', testCase.id) },
      ]
    );
  };

  const renderTestCase = ({ item }: { item: TestCase }) => (
    <TouchableOpacity 
      style={styles.testCaseCard}
      onPress={() => handleTestCasePress(item)}
    >
      <View style={styles.testCaseHeader}>
        <Text style={styles.testCaseName}>{item.name}</Text>
        <TouchableOpacity 
          style={styles.runButton}
          onPress={() => handleRunTest(item)}
        >
          <Ionicons name="play" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {item.description && (
        <Text style={styles.testCaseDescription}>{item.description}</Text>
      )}
      
      {item.url && (
        <Text style={styles.testCaseUrl}>{item.url}</Text>
      )}
      
      <View style={styles.testCaseFooter}>
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 2).map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
          )}
        </View>
        
        <Text style={styles.modifiedDate}>
          Modified: {item.modified.toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search test cases..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Test Cases List */}
      <FlatList
        data={filteredTestCases}
        keyExtractor={(item) => item.id}
        renderItem={renderTestCase}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No test cases match your search' : 'No test cases found'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>Create Your First Test</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={filteredTestCases.length === 0 ? styles.emptyList : undefined}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  testCaseCard: {
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
  testCaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testCaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  runButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 4,
  },
  testCaseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  testCaseUrl: {
    fontSize: 12,
    color: '#007BFF',
    marginBottom: 12,
  },
  testCaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#495057',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  modifiedDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default TestCasesScreen;