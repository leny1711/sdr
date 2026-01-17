import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';
import AnimatedTextInput from '../components/AnimatedTextInput';
import { getGenderLabel, INTEREST_OPTIONS } from '../constants/user';

const MAX_IMAGE_SIZE_BYTES = 3_000_000; // ~3MB

const ProfileScreen = () => {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAge(user.age.toString());
      setCity(user.city);
      setDescription(user.description);
      setPhotoUrl(user.photoUrl || null);
    }
  }, [user]);

  const handlePickImage = async (fromCamera = false) => {
    setIsPickingImage(true);
    try {
      if (fromCamera) {
        // Request camera permission on Android
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Permission Caméra',
              message: 'Cette application nécessite l\'accès à votre caméra.',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Autorisation requise',
              'Merci d\'autoriser l\'accès à la caméra pour prendre une photo.'
            );
            return;
          }
        }
      } else {
        // Request storage permission on Android
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Permission Photos',
              message: 'Cette application nécessite l\'accès à vos photos.',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Autorisation requise',
              'Merci d\'autoriser l\'accès à vos photos pour ajouter une image de profil.'
            );
            return;
          }
        }
      }

      const options = {
        mediaType: 'photo' as const,
        quality: 0.6 as const,
        includeBase64: true,
        maxWidth: 1024,
        maxHeight: 1024,
      };

      const result = fromCamera
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (!result.didCancel && result.assets?.length) {
        const asset = result.assets[0];
        const mimeType = asset.type || 'image/jpeg';
        const base64Data = (asset.base64 || '').replace(/=+$/, '');
        const sizeBytes = base64Data ? Math.ceil((base64Data.length * 3) / 4) : asset.fileSize || 0;

        if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
          Alert.alert('Photo trop lourde', 'Merci de choisir une image plus légère (max ~3 Mo).');
          return;
        }
        const dataUrl = base64Data ? `data:${mimeType};base64,${base64Data}` : asset.uri;
        setPhotoUrl(dataUrl || '');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de l\'image.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Supprimer la photo ?',
      'Votre photo sera retirée et vos futurs matchs commenceront avec une photo cachée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => setPhotoUrl(null),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name || !age || !city || !description) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      Alert.alert('Âge invalide', 'Vous devez avoir au moins 18 ans.');
      return;
    }

    if (description.length < 100) {
      Alert.alert('Description trop courte', 'La description doit contenir au moins 100 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.updateProfile({
        name: name.trim(),
        age: ageNum,
        city: city.trim(),
        description: description.trim(),
        photoUrl: photoUrl ?? null,
      });
      await refreshUser();
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès.');
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Mise à jour impossible.');
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
      setPhotoUrl(user.photoUrl || null);
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', onPress: logout, style: 'destructive' },
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

  const renderInterests = (values?: string[]) => {
    if (!values || values.length === 0) return 'Non renseigné';
    const labels = values
      .map((value) => INTEREST_OPTIONS.find((option) => option.value === value)?.label || value)
      .filter(Boolean);
    return labels.length ? labels.join(', ') : 'Non renseigné';
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editButton}>Modifier</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Photo de profil</Text>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderText}>Photo cachée</Text>
            </View>
          )}
          {isEditing && (
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={[styles.photoButton, isPickingImage && styles.buttonDisabled]}
                onPress={() => handlePickImage(false)}
                disabled={isPickingImage}
              >
                <Text style={styles.photoButtonText}>Bibliothèque</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, isPickingImage && styles.buttonDisabled]}
                onPress={() => handlePickImage(true)}
                disabled={isPickingImage}
              >
                <Text style={styles.photoButtonText}>Appareil photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, styles.deletePhotoButton]}
                onPress={handleDeletePhoto}
                disabled={isPickingImage}
              >
                <Text style={[styles.photoButtonText, styles.deletePhotoButtonText]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Nom</Text>
          {isEditing ? (
            <AnimatedTextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor={Colors.textTertiary}
            />
          ) : (
            <Text style={styles.value}>{user.name}</Text>
          )}

          <Text style={styles.label}>Âge</Text>
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

          <Text style={styles.label}>Ville</Text>
          {isEditing ? (
            <AnimatedTextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Votre ville"
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
                placeholder="Parlez de vous..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{description.length}/100 caractères</Text>
            </>
          ) : (
            <Text style={styles.descriptionValue}>{user.description}</Text>
          )}

          <Text style={styles.label}>Genre</Text>
          <Text style={styles.value}>{getGenderLabel(user.gender)}</Text>

          <Text style={styles.label}>Préférences</Text>
          <Text style={styles.value}>{renderInterests(user.interestedIn)}</Text>

          {isEditing && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isEditing && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Se déconnecter</Text>
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
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgSecondary,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: Colors.textTertiary,
    fontFamily: Typography.fontSans,
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  photoButton: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
  deletePhotoButton: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  deletePhotoButtonText: {
    color: Colors.bgPrimary,
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
