import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';

export default function LoginScreen() {
  // Comme en React web : un state contrôlé par champ. Rien de nouveau ici,
  // useState fonctionne exactement pareil en React Native.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Placeholder pour l'instant — on branchera la vraie connexion Clerk
    // à l'étape "Authentification" du planning, une fois cet écran validé.
    console.log('Connexion avec', email);
  };

  return (
    // SafeAreaView : évite que le contenu passe sous l'encoche/la barre de
    // statut iOS ou la barre système Android. Équivalent RN du padding-top
    // env(safe-area-inset-top) qu'on utilise dans les artifacts.
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* En-tête : logo + nom, comme dans la maquette */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <MaterialIcons name="home" size={24} color={colors.white} />
          </View>
          <Text style={styles.brandName}>LAMAISON</Text>
        </View>

        <Text style={styles.title}>Bon retour chez vous</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour suivre vos annonces, vos visites et vos échanges.
        </Text>

        {/* Champ email */}
        <View style={styles.field}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="mail-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="vous@exemple.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              // Ces deux props n'existent pas sur le web — spécifiques mobile :
              autoCapitalize="none"  // évite que le clavier mette une majuscule automatique
              keyboardType="email-address"  // adapte le clavier virtuel (affiche le @ directement)
            />
          </View>
        </View>

        {/* Champ mot de passe */}
        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperFocused]}>
            <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}  // équivalent RN de type="password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.link}>Mot de passe oublié ?</Text>
        </View>

        {/* Bouton principal. Pressable plutôt que <button> (qui n'existe pas
            en RN) — gère nativement les états pressed/disabled sur tactile. */}
        <Pressable style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Se connecter</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.divider} />
        </View>

        <Pressable style={styles.secondaryButton}>
          <MaterialIcons name="phone-iphone" size={20} color="#374151" />
          <Text style={styles.secondaryButtonText}>Continuer avec mon numéro</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nouveau sur LAMAISON ? </Text>
          {/* Link : le composant de navigation d'expo-router, équivalent du
              <Link> de React Router web. "href" pointe vers un chemin de
              fichier dans app/, pas une URL. */}
          <Link href="/signup" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Créer un compte</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

// StyleSheet.create : contrairement à un simple objet JS, RN optimise ces
// styles en interne (validation, et sur certaines plateformes conversion en
// identifiants numériques réutilisés au lieu de recréer l'objet à chaque
// rendu). Convention systématique en React Native, on la garde partout.
const styles = StyleSheet.create({
  container: {
    flex: 1,  // occupe tout l'écran disponible — quasi toujours flex:1 sur le conteneur racine
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  brand: {
    flexDirection: 'row',  // par défaut c'est column, donc ici on l'inverse explicitement
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
  },
  title: {
    marginTop: 40,
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  field: {
    marginTop: 20,
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputWrapperFocused: {
    backgroundColor: colors.white,
    // RN n'a pas box-shadow — sur iOS on utilise shadowColor/shadowOffset/etc,
    // sur Android "elevation". Pour un simple contour comme ici, plus simple
    // et cross-plateforme d'utiliser borderWidth + borderColor.
    borderWidth: 2,
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  row: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  primaryButton: {
    marginTop: 26,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  dividerRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
  },
  secondaryButton: {
    marginTop: 18,
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  footer: {
    marginTop: 'auto',  // pousse le footer en bas — marche pareil qu'en CSS flexbox web
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});