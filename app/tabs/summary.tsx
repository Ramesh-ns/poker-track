import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { usePoker } from '../../context/PokerContext';
import { Colors } from '../../constants/Colors';
import { SessionSummary } from '../../components/SessionSummary';
import { Session, SessionSummary as SessionSummaryType } from '../../types/poker';

function transformSessionToSummary(session: Session): SessionSummaryType {
  const playerSummaries = session.players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    totalPotsTaken: player.potsTaken,
    totalPotsReturned: player.potsReturned,
    totalPotsTakenValue: player.potsTaken * session.potValue,
    totalPotsReturnedValue: player.potsReturned * session.potValue,
    netBalance: (player.potsTaken - player.potsReturned) * session.potValue
  }));

  return {
    sessionId: session.id,
    potValue: session.potValue,
    playerSummaries
  };
}

export default function SummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { previousSessions } = usePoker();

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Session History</Text>
      
      <ScrollView style={styles.scrollView}>
        {previousSessions.length === 0 ? (
          <Text style={[styles.emptyMessage, { color: textColor }]}>
            No previous sessions to display.
          </Text>
        ) : (
          previousSessions.map(session => (
            <SessionSummary 
              key={session.id} 
              summary={transformSessionToSummary(session)} 
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    fontStyle: 'italic',
  },
}); 