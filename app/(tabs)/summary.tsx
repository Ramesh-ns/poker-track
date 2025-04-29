import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/Button';
import { SessionSummary as SessionSummaryComponent } from '../../components/SessionSummary';
import { usePoker } from '../../context/PokerContext';
import { Colors } from '../../constants/Colors';

export default function SummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { session, getSessionSummary } = usePoker();
  
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;

  const summary = getSessionSummary();

  if (!session || !summary) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.message, { color: textColor }]}>
          No session summary available. Start a new session from the Home tab.
        </Text>
        <Button 
          title="Go to Home" 
          onPress={() => router.push('/(tabs)')}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SessionSummaryComponent summary={summary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    alignSelf: 'center',
  },
}); 