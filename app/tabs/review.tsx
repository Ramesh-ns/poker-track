import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { usePoker } from '../../context/PokerContext';
import { Colors } from '../../constants/Colors';
import { PlayerCard } from '../../components/PlayerCard';

export default function ReviewScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { previousSessions } = usePoker();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const session = previousSessions.find(s => s.id === sessionId);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.message, { color: textColor }]}>
          Session not found.
        </Text>
      </View>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const formatDuration = (startTime: Date, endTime: Date) => {
    const duration = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return hours.toString() + 'h ' + minutes.toString() + 'm';
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          Session Review
        </Text>
        <Text style={[styles.date, { color: textColor }]}>
          {formatDate(session.startTime)} - {formatDuration(session.startTime, session.endTime!)}
        </Text>
      </View>

      <View style={styles.sessionInfo}>
        <Text style={[styles.potValue, { color: textColor }]}>
          {'Pot Value: $' + session.potValue.toFixed(2)}
        </Text>
      </View>

      <ScrollView style={styles.playersList}>
        {session.players.length === 0 ? (
          <Text style={[styles.emptyMessage, { color: textColor }]}>
            No players in this session.
          </Text>
        ) : (
          session.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              potValue={session.potValue}
              onUpdatePotsTaken={() => {}}
              onUpdatePotsReturned={() => {}}
              onDeletePlayer={() => {}}
              isEndingSession={false}
              isReadOnly={true}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#666666',
  },
  sessionInfo: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  potValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  playersList: {
    flex: 1,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    fontStyle: 'italic',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 24,
  },
}); 