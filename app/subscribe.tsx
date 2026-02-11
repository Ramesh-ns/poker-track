import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    useColorScheme,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { BlurView } from 'expo-blur';

export default function SubscriptionScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const textColor = isDark ? Colors.dark.text : Colors.light.text;
    const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
    const cardColor = isDark ? '#1C1C1E' : '#F2F2F7';
    const accentColor = '#D4AF37'; // Gold for premium feel

    const features = [
        { icon: 'stats-chart', text: 'Detailed Session Analytics' },
        { icon: 'infinite', text: 'Unlimited Session Logs' },
        { icon: 'cloud-upload', text: 'Cloud Backups & Sync' },
        { icon: 'people', text: 'Multi-Player History Tracking' },
        { icon: 'share-social', text: 'Export Data to CSV/JSON (Coming Soon)' },
        { icon: 'rocket', text: 'Priority Support & Future Updates' },
    ];

    const handleSubscribe = () => {
        // This would call your IAP logic
        console.log('Subscribe button pressed');
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Close Button */}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="close-circle" size={32} color={textColor} />
                </TouchableOpacity>

                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: textColor }]}>Poker Track</Text>
                    <Text style={[styles.proBadge, { borderColor: accentColor, color: accentColor }]}>PRO</Text>
                    <Text style={[styles.subtitle, { color: textColor }]}>
                        Master your game with professional tools
                    </Text>
                </View>

                {/* Features List */}
                <View style={styles.featuresContainer}>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Ionicons name={feature.icon as any} size={24} color={accentColor} style={styles.featureIcon} />
                            <Text style={[styles.featureText, { color: textColor }]}>{feature.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Subscription Plan Card */}
                <View style={[styles.planCard, { backgroundColor: cardColor }]}>
                    <View style={styles.trialBadge}>
                        <Text style={styles.trialText}>1 MONTH FREE TRIAL</Text>
                    </View>
                    <Text style={[styles.planTitle, { color: textColor }]}>Monthly Subscription</Text>
                    <Text style={[styles.planPrice, { color: textColor }]}>$6.99 / month</Text>
                    <Text style={styles.planSubtext}>Cancel anytime in Settings</Text>

                    <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: accentColor }]} onPress={handleSubscribe}>
                        <Text style={styles.subscribeButtonText}>Start 1 Month Free Trial</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer Links (Required by Apple) */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => console.log('Privacy')}>
                        <Text style={styles.footerLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerDivider}>•</Text>
                    <TouchableOpacity onPress={() => console.log('Terms')}>
                        <Text style={styles.footerLink}>Terms of Use</Text>
                    </TouchableOpacity>
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
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 1,
    },
    proBadge: {
        fontSize: 14,
        fontWeight: 'bold',
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        opacity: 0.8,
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    featureIcon: {
        marginRight: 16,
        width: 28,
    },
    featureText: {
        fontSize: 16,
        fontWeight: '500',
    },
    planCard: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    trialBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        position: 'absolute',
        top: -12,
    },
    trialText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    planTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '800',
        marginVertical: 12,
    },
    planSubtext: {
        color: '#666',
        fontSize: 14,
        marginBottom: 24,
    },
    subscribeButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    subscribeButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 40,
        opacity: 0.5,
    },
    footerLink: {
        fontSize: 12,
        color: '#666',
    },
    footerDivider: {
        marginHorizontal: 10,
        fontSize: 12,
        color: '#666',
    },
});
