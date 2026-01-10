import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import { User } from '../types';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// App Screens
import DiscoveryScreen from '../screens/DiscoveryScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MatchProfileScreen from '../screens/MatchProfileScreen';

// Navigation Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Discovery: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Chat: {
    conversationId: string;
    matchName: string;
    matchPhotoUrl?: string;
  };
  MatchProfile: {
    user: User;
    revealLevel: number;
    conversationId?: string;
  };
};

// Navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const AppNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bgPrimary,
    card: Colors.bgSecondary,
    border: Colors.borderLight,
    primary: Colors.buttonPrimary,
    text: Colors.textPrimary,
  },
};

// Auth Navigator - Login and Register screens
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgPrimary },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Bottom Tab Navigator - Main app tabs
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgPrimary,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingBottom: bottomInset,
          paddingTop: 8,
          height: 60 + bottomInset,
        },
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Discovery" 
        component={DiscoveryScreen}
        options={{
          tabBarLabel: 'Découvertes',
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Matchs',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

// App Navigator - Contains tabs and modal screens like Chat
const AppNavigator = () => {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgPrimary },
      }}
    >
      <AppStack.Screen name="MainTabs" component={TabNavigator} />
      <AppStack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.bgPrimary,
          },
          headerTintColor: Colors.textPrimary,
          headerTitle: '',
        }}
      />
      <AppStack.Screen
        name="MatchProfile"
        component={MatchProfileScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.bgPrimary,
          },
          headerTintColor: Colors.textPrimary,
          title: 'Profil du match',
        }}
      />
    </AppStack.Navigator>
  );
};

// Main Navigation Component
export const Navigation = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return null; // Could show a loading screen here
  }

  // Switch between Auth and App navigators based on auth state
  const isAuthenticated = !!(user && token);

  return (
    <NavigationContainer theme={AppNavigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
