import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import TestCasesScreen from '../screens/TestCasesScreen';
import ExecutionsScreen from '../screens/ExecutionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TestCaseDetailScreen from '../screens/TestCaseDetailScreen';
import ExecutionDetailScreen from '../screens/ExecutionDetailScreen';
import ConnectionScreen from '../screens/ConnectionScreen';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  TestCaseDetail: { testCaseId: string };
  ExecutionDetail: { executionId: string };
  Connection: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  TestCases: undefined;
  Executions: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TestCases') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Executions') {
            iconName = focused ? 'play' : 'play-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#007BFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="TestCases" 
        component={TestCasesScreen} 
        options={{ title: 'Test Cases' }}
      />
      <Tab.Screen 
        name="Executions" 
        component={ExecutionsScreen} 
        options={{ title: 'Executions' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007BFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TestCaseDetail" 
          component={TestCaseDetailScreen}
          options={{ title: 'Test Case Details' }}
        />
        <Stack.Screen 
          name="ExecutionDetail" 
          component={ExecutionDetailScreen}
          options={{ title: 'Execution Details' }}
        />
        <Stack.Screen 
          name="Connection" 
          component={ConnectionScreen}
          options={{ title: 'Connect to Web App' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;