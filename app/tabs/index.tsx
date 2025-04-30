import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { usePoker } from '../../context/PokerContext';
import { PlayerCard } from '../../components/PlayerCard';
import { SessionSummary } from '../../components/SessionSummary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Session, Player } from '../../types/poker';

export default function HomeScreen() {
  const { 
    session, 
    previousSessions, 
    startSession, 
    addPlayer, 
    endSession,
    updatePotsTaken,
    updatePotsReturned 
  } = usePoker();
  const [potValue, setPotValue] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleStartSession = () => {
    const value = parseFloat(potValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid pot value');
      return;
    }
    startSession(value);
    setPotValue('');
    setError('');
  };

  const handleAddPlayer = () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }
    addPlayer(playerName.trim());
    setPlayerName('');
    setError('');
  };

  const handleEndSession = () => {
    if (!session) return;
    
    const allPotsReturned = session.players.every(player => player.potsReturned > 0);
    if (!allPotsReturned) {
      Alert.alert(
        'Cannot End Session',
        'All players must return their pots before ending the session.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    endSession();
  };

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
    return `${hours}h ${minutes}m`;
  };

  const renderPreviousSession = (session: Session) => {
    const totalPots = session.players.reduce((sum: number, player: Player) => sum + player.potsTaken, 0);
    const totalReturned = session.players.reduce((sum: number, player: Player) => sum + player.potsReturned, 0);
    const netBalance = totalPots - totalReturned;
    
    return (
      <View key={session.id} style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionDate}>
            {formatDate(session.startTime)}
          </Text>
          <Text style={styles.sessionDuration}>
            {formatDuration(session.startTime, session.endTime!)}
          </Text>
        </View>
        
        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pot Value:</Text>
            <Text style={styles.detailValue}>${session.potValue.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Players:</Text>
            <Text style={styles.detailValue}>{session.players.length}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Pots:</Text>
            <Text style={styles.detailValue}>${totalPots.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Net Balance:</Text>
            <Text style={[
              styles.detailValue,
              { color: netBalance >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              <Text>${Math.abs(netBalance).toFixed(2)}{' '}{netBalance >= 0 ? 'profit' : 'loss'}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Start New Session</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pot Value ($)</Text>
              <TextInput
                style={styles.input}
                value={potValue}
                onChangeText={setPotValue}
                keyboardType="decimal-pad"
                placeholder="Enter pot value"
              />
              {error && <Text style={styles.error}>{error}</Text>}
            </View>
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleStartSession}
            >
              <Text style={styles.buttonText}>Start Session</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previousSessionsContainer}>
            <Text style={styles.sectionTitle}>Previous Sessions</Text>
            {previousSessions.length === 0 ? (
              <Text style={styles.emptyMessage}>No previous sessions</Text>
            ) : (
              previousSessions.map(renderPreviousSession)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.activeSessionContainer}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Active Session</Text>
            <Text style={styles.potValue}>
              <Text>Pot Value: ${session.potValue.toFixed(2)}</Text>
            </Text>
          </View>

          <View style={styles.addPlayerContainer}>
            <TextInput
              style={styles.playerInput}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter player name"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddPlayer}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {session.players.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.emptyMessage]}>
                No players added yet. Add players to start tracking pots.
              </Text>
            </View>
          ) : (
            session.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                potValue={session.potValue}
                onUpdatePotsTaken={(playerId, potsTaken) => {
                  updatePotsTaken(playerId, potsTaken);
                }}
                onUpdatePotsReturned={(playerId, potsReturned) => {
                  updatePotsReturned(playerId, potsReturned);
                }}
                isEndingSession={false}
              />
            ))
          )}

          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndSession}
          >
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previousSessionsContainer}>
          <Text style={styles.sectionTitle}>Previous Sessions</Text>
          {previousSessions.length === 0 ? (
            <Text style={styles.emptyMessage}>No previous sessions</Text>
          ) : (
            previousSessions.map(renderPreviousSession)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: '#F44336',
    marginTop: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeSessionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionInfo: {
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  potValue: {
    fontSize: 18,
    color: '#666666',
  },
  addPlayerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  endButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previousSessionsContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sessionDuration: {
    fontSize: 14,
    color: '#666666',
  },
  sessionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
});
