import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../src/config/theme';

export default function SignupScreen() {
    const router = useRouter();
    const [firstname, setFirstname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = () => {
        // Placeholder — branché sur Clerk à l'étape Authentification.
        console.log('Inscription', { firstname, email, phone });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ScrollView plutôt que View : ce formulaire a plus de champs que
          l'écran de connexion, il doit pouvoir défiler si le clavier prend
          de la place ou sur un petit écran. Un simple View ne scroll jamais. */}
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Créer un compte</Text>
                </View>

                <Text style={styles.title}>Quelques infos et{'\n'}vous êtes chez vous</Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Prénom et nom</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="person-outline" size={20} color="#9ca3af" />
                        <TextInput
                            style={styles.input}
                            placeholder="Votre nom complet"
                            placeholderTextColor="#9ca3af"
                            value={firstname}
                            onChangeText={setFirstname}
                        />
                    </View>
                </View>

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
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Téléphone</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.countryCode}>🇨🇲 +237</Text>
                        <View style={styles.separator} />
                        <TextInput
                            style={styles.input}
                            placeholder="6 99 41 08 27"
                            placeholderTextColor="#9ca3af"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                </View>

                <Pressable style={styles.primaryButton} onPress={handleSignup}>
                    <Text style={styles.primaryButtonText}>Créer mon compte</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 16, fontWeight: '800' },
    title: {
        marginTop: 22,
        fontSize: 26,
        fontWeight: '800',
        lineHeight: 33,
        color: colors.text,
    },
    field: { marginTop: 18, gap: 6 },
    label: { fontSize: 13, fontWeight: '700', color: '#374151' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.background,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        paddingVertical: 15,
    },
    input: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
    countryCode: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
    separator: { width: 1, height: 18, backgroundColor: '#DDE1DE' },
    primaryButton: {
        marginTop: 28,
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: 17,
        alignItems: 'center',
    },
    primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});