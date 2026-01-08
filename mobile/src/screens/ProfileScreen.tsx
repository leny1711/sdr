import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';
import AnimatedTextInput from '../components/AnimatedTextInput';

const ProfileScreen = () => {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAge(user.age.toString());
      setCity(user.city);
      setDescription(user.description);
    }
  }, [user]);

  const handleSave = async () => {
    if (!name || !age || !city || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      Alert.alert('Error', 'Age must be at least 18');
      return;
    }

    if (description.length < 100) {
      Alert.alert('Error', 'Description must be at least 100 characters');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.updateProfile({
        name: name.trim(),
        age: ageNum,
        city: city.trim(),
        description: description.trim(),
      });
      await refreshUser();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setAge(user.age.toString());
      setCity(user.city);
      setDescription(user.description);
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (!user) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Name</Text>
          {isEditing ? (
            <AnimatedTextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
            />
          ) : (
            <Text style={styles.value}>{user.name}</Text>
          )}

          <Text style={styles.label}>Age</Text>
          {isEditing ? (
            <AnimatedTextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="18+"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
            />
          ) : (
            <Text style={styles.value}>{user.age}</Text>
          )}

          <Text style={styles.label}>City</Text>
          {isEditing ? (
            <AnimatedTextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Your city"
              placeholderTextColor={Colors.textTertiary}
            />
          ) : (
            <Text style={styles.value}>{user.city}</Text>
          )}

          <Text style={styles.label}>Description</Text>
          {isEditing ? (
            <>
              <AnimatedTextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell your story..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{description.length}/100 characters</Text>
            </>
          ) : (
            <Text style={styles.descriptionValue}>{user.description}</Text>
          )}

          {isEditing && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isEditing && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
  },
  editButton: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  value: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    padding: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  descriptionValue: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    lineHeight: Typography.base * Typography.lineHeightBody,
    padding: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  characterCount: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.buttonPrimary,
  },
  saveButtonText: {
    color: Colors.bgPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.bgPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
