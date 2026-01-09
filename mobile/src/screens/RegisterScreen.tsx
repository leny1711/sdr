import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const GENDER_OPTIONS = ['Homme', 'Femme', 'Autre'];
const MATCH_PREFERENCE_OPTIONS = ['Hommes', 'Femmes', 'Les deux'];

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [matchPreference, setMatchPreference] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const { register } = useAuth();

  const handlePickImage = async (fromCamera = false) => {
    setIsPickingImage(true);
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Autorisation requise',
          'Merci d’autoriser l’accès à vos photos pour ajouter une image de profil.'
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUrl = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
        setPhotoUrl(dataUrl || '');
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name || !age || !gender || !matchPreference || !city || !description) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs obligatoires.');
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

    if (!photoUrl) {
      Alert.alert('Photo requise', 'Ajoutez une photo de profil pour continuer.');
      return;
    }

    if (!GENDER_OPTIONS.includes(gender)) {
      Alert.alert('Genre invalide', 'Sélectionnez une option dans la liste.');
      return;
    }

    if (!MATCH_PREFERENCE_OPTIONS.includes(matchPreference)) {
      Alert.alert('Préférence invalide', 'Sélectionnez une option dans la liste.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        age: ageNum,
        gender: gender.trim(),
        matchPreference,
        city: city.trim(),
        description: description.trim(),
        photoUrl,
      });
    } catch (error: any) {
      Alert.alert(
        'Inscription impossible',
        error.response?.data?.message || error.response?.data?.error || 'Création du compte impossible'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez l’expérience SDR</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe (min. 6 caractères)"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoComplete="password-new"
              />

              <Text style={styles.label}>Prénom ou pseudo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Votre prénom ou pseudo"
                placeholderTextColor={Colors.textTertiary}
                autoComplete="name"
              />

              <Text style={styles.label}>Âge</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="18+"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Genre</Text>
              <View style={styles.optionRow}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionPill, gender === option && styles.optionPillSelected]}
                    onPress={() => setGender(option)}
                  >
                    <Text style={[styles.optionText, gender === option && styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Préférences de rencontre</Text>
              <View style={styles.optionRow}>
                {MATCH_PREFERENCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionPill,
                      matchPreference === option && styles.optionPillSelected,
                    ]}
                    onPress={() => setMatchPreference(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        matchPreference === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Ville</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Votre ville"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.label}>Description (min. 100 caractères)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Parlez de vous, de ce que vous aimez et de ce que vous recherchez."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {description.length}/100 caractères
              </Text>

              <Text style={styles.label}>Photo de profil (obligatoire)</Text>
              <View style={styles.photoContainer}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Text style={styles.photoPlaceholderText}>Aucune photo</Text>
                  </View>
                )}
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
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Création du compte...' : 'S’inscrire'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Déjà un compte ? Connexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.xxxl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontSerif,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
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
  input: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgSecondary,
  },
  optionPillSelected: {
    backgroundColor: Colors.buttonPrimary,
    borderColor: Colors.buttonPrimary,
  },
  optionText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.bgPrimary,
    fontWeight: '700',
  },
  characterCount: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  photoContainer: {
    gap: Spacing.sm,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
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
    gap: Spacing.sm,
  },
  photoButton: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
  },
  photoButtonText: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  buttonText: {
    color: Colors.bgPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});

export default RegisterScreen;
