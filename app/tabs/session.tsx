import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PlayerCard } from '../../components/PlayerCard';
import { usePoker } from '../../context/PokerContext';
import { Colors } from '../../constants/Colors';

export default function SessionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { session, addPlayer, updatePotsTaken, updatePotsReturned, endSession } = usePoker();
  
  const [playerName, setPlayerName] = useState('');
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [error, setError] = useState('');

  // Set isEndingSession to true if the session is not active
  React.useEffect(() => {
    if (session && !session.isActive) {
      setIsEndingSession(true);
    }
  }, [session]);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;

  const handleAddPlayer = () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }
    
    addPlayer(playerName);
    setPlayerName('');
    setError('');
  };

  const handleEndSession = () => {
    if (session?.players.length === 0) {
      Alert.alert('Error', 'Cannot end session with no players');
      return;
    }
    
    setIsEndingSession(true);
  };

  const handleConfirmEndSession = () => {
    // Check if all players have entered their returned pots
    const allPlayersHaveReturnedPots = session?.players.every(player => player.potsReturned >= 0);
    
    if (!allPlayersHaveReturnedPots) {
      Alert.alert('Error', 'All players must enter their returned pots before ending the session');
      return;
    }
    
    // Set default value of 0 for players who haven't returned any pots
    session?.players.forEach(player => {
      if (player.potsReturned === 0) {
        updatePotsReturned(player.id, 0);
      }
    });
    
    Alert.alert(
      'Confirm End Session',
      'Are you sure you want to end this session? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            // End the session
            endSession();
            
            // Navigate to the home screen
            setTimeout(() => {
              router.push('/tabs');
            }, 100);
          },
        },
      ]
    );
  };

  const canEndSession = () => {
    if (!session || !isEndingSession) return false;
    
    // Check if all players have entered their returned pots
    const allPlayersHaveReturnedPots = session.players.every(player => player.potsReturned >= 0);
    
    return allPlayersHaveReturnedPots;
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.message, { color: textColor }]}>
          No active session. Start a new session from the Home tab.
        </Text>
        <Button 
          title="Go to Home" 
          onPress={() => router.push('/tabs')}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          {session.isActive ? 'Active Session' : 'Ended Session'} - Pot Value: ${session.potValue}
        </Text>
        {session.isActive && (
          !isEndingSession ? (
            <Button 
              title="End Session" 
              onPress={handleEndSession}
              variant="danger"
              style={styles.endButton}
            />
          ) : (
            <Button 
              title="Confirm End Session" 
              onPress={handleConfirmEndSession}
              variant="danger"
              style={styles.endButton}
              disabled={!canEndSession()}
            />
          )
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: textColor }]}>
        {isEndingSession ? 'Return Pots' : 'Track Pots'}
      </Text>

      <ScrollView style={styles.playersList}>
        {session.players.length === 0 ? (
          <Text style={[styles.emptyMessage, { color: textColor }]}>
            No players added yet. Add players to start tracking pots.
          </Text>
        ) : (
          session.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              potValue={session.potValue}
              onUpdatePotsTaken={updatePotsTaken}
              onUpdatePotsReturned={updatePotsReturned}
              isEndingSession={isEndingSession}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  endButton: {
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  playersList: {
    flex: 1,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
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