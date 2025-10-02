import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    webAppUrl: 'http://localhost:3000',
    autoConnect: true,
    syncInterval: 5,
    enableNotifications: true,
    darkMode: false,
    cacheTestCases: true,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testConnection = () => {
    Alert.alert(
      'Connection Test',
      'Testing connection to web app...',
      [{ text: 'OK' }]
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => console.log('Cache cleared') },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    children 
  }: { 
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#007BFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Connection Settings */}
      <Text style={styles.sectionTitle}>Connection</Text>
      
      <SettingItem
        icon="globe"
        title="Web App URL"
        description="URL of the Web AutoTest Pro application"
      >
        <TextInput
          style={styles.textInput}
          value={settings.webAppUrl}
          onChangeText={(value) => updateSetting('webAppUrl', value)}
          placeholder="http://localhost:3000"
        />
      </SettingItem>

      <SettingItem
        icon="wifi"
        title="Auto Connect"
        description="Automatically connect to web app on startup"
      >
        <Switch
          value={settings.autoConnect}
          onValueChange={(value) => updateSetting('autoConnect', value)}
        />
      </SettingItem>

      <SettingItem
        icon="refresh"
        title="Sync Interval"
        description="How often to sync data (minutes)"
      >
        <TextInput
          style={styles.numberInput}
          value={settings.syncInterval.toString()}
          onChangeText={(value) => updateSetting('syncInterval', parseInt(value) || 5)}
          keyboardType="numeric"
        />
      </SettingItem>

      <TouchableOpacity style={styles.actionButton} onPress={testConnection}>
        <Ionicons name="flash" size={20} color="#007BFF" />
        <Text style={styles.actionButtonText}>Test Connection</Text>
      </TouchableOpacity>

      {/* App Settings */}
      <Text style={styles.sectionTitle}>App Settings</Text>

      <SettingItem
        icon="notifications"
        title="Enable Notifications"
        description="Receive notifications about test results"
      >
        <Switch
          value={settings.enableNotifications}
          onValueChange={(value) => updateSetting('enableNotifications', value)}
        />
      </SettingItem>

      <SettingItem
        icon="moon"
        title="Dark Mode"
        description="Use dark theme"
      >
        <Switch
          value={settings.darkMode}
          onValueChange={(value) => updateSetting('darkMode', value)}
        />
      </SettingItem>

      <SettingItem
        icon="download"
        title="Cache Test Cases"
        description="Store test cases locally for offline access"
      >
        <Switch
          value={settings.cacheTestCases}
          onValueChange={(value) => updateSetting('cacheTestCases', value)}
        />
      </SettingItem>

      {/* Data Management */}
      <Text style={styles.sectionTitle}>Data</Text>

      <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
        <Ionicons name="trash" size={20} color="#dc3545" />
        <Text style={[styles.actionButtonText, { color: '#dc3545' }]}>Clear Cache</Text>
      </TouchableOpacity>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>

      <View style={styles.aboutCard}>
        <Text style={styles.appName}>Web AutoTest Pro Companion</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.description}>
          Mobile companion app for managing and monitoring automated web tests.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 20,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    minWidth: 120,
    fontSize: 14,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#007BFF',
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SettingsScreen;