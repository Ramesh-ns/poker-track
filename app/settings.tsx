import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

export default function SettingsScreen() {
    const { deleteAccount, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action is permanent and all your data (sessions, players, history) will be deleted. This cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteAccount();
                            Alert.alert('Account Deleted', 'Your account and data have been successfully removed.');
                            router.replace('/login');
                        } catch (error: any) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Settings',
                    headerBackTitle: 'Back',
                    headerTintColor: colors.text,
                    headerStyle: { backgroundColor: colors.background },
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
                    <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeleteAccount}
                            disabled={isDeleting || authLoading}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            <Text style={styles.deleteText}>Delete Account</Text>
                            {(isDeleting || authLoading) && <ActivityIndicator size="small" color="#FF3B30" style={{ marginLeft: 8 }} />}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helpText}>
                        Deleting your account will remove all your poker sessions, player lists, and profile information from our servers.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: isDark ? '#8E8E93' : '#AEAEB2' }]}>
                        Version 1.0.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
        opacity: 0.6,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }
        }),
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    deleteText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '500',
        marginLeft: 12,
    },
    helpText: {
        fontSize: 13,
        color: '#8E8E93',
        paddingHorizontal: 16,
        paddingTop: 8,
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
        paddingBottom: 32,
    },
    versionText: {
        fontSize: 14,
    },
});
