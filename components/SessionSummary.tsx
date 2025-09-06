import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { SessionSummary as SessionSummaryType, PlayerSummary } from '../types/poker';

interface SessionSummaryProps {
  summary: SessionSummaryType;
  potMode?: 'fixed' | 'direct';
}

export function SessionSummary({ summary, potMode = 'fixed' }: SessionSummaryProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#fff' : '#000';
  const cardBackgroundColor = isDark ? '#2c2c2e' : '#f2f2f7';
  const borderColor = isDark ? '#3a3a3c' : '#c7c7cc';
  const positiveColor = isDark ? '#32d74b' : '#34c759';
  const negativeColor = isDark ? '#ff453a' : '#ff3b30';

  // Sort players by net balance (highest to lowest)
  const sortedPlayers = [...summary.playerSummaries].sort((a, b) => b.netBalance - a.netBalance);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: cardBackgroundColor, borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Session Summary</Text>
        <Text style={[styles.potValue, { color: textColor }]}>
          {potMode === 'direct' 
            ? 'Direct Dollar Mode'
            : `Pot Value: $${summary.potValue.toFixed(2)}`
          }
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {sortedPlayers.map((player) => (
          <View 
            key={player.playerId} 
            style={[styles.playerCard, { backgroundColor: cardBackgroundColor, borderColor }]}
          >
            <Text style={[styles.playerName, { color: textColor }]}>{player.playerName}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: textColor }]}>
                  {potMode === 'direct' ? 'Amount Taken:' : 'Pots Taken:'}
                </Text>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {potMode === 'direct' 
                    ? `$${player.totalPotsTakenValue.toFixed(2)}`
                    : `${player.totalPotsTaken.toString()} ($${player.totalPotsTakenValue.toFixed(2)})`
                  }
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: textColor }]}>
                  {potMode === 'direct' ? 'Amount Returned:' : 'Pots Returned:'}
                </Text>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {potMode === 'direct' 
                    ? `$${player.totalPotsReturnedValue.toFixed(2)}`
                    : `${player.totalPotsReturned.toString()} ($${player.totalPotsReturnedValue.toFixed(2)})`
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.balanceContainer}>
              <Text style={[styles.balanceLabel, { color: textColor }]}>Net Balance:</Text>
              <Text 
                style={[
                  styles.balanceValue, 
                  { color: player.netBalance >= 0 ? positiveColor : negativeColor }
                ]}
              >
                {'$' + Math.abs(player.netBalance).toFixed(2)} {player.netBalance >= 0 ? 'profit' : 'loss'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  potValue: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  playerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3c',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 