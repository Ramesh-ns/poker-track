import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { Player } from '../types/poker';
import { Button } from './Button';

interface PlayerCardProps {
  player: Player;
  potValue: number;
  onUpdatePotsTaken: (playerId: string, potsTaken: number) => void;
  onUpdatePotsReturned: (playerId: string, potsReturned: number) => void;
  isEndingSession?: boolean;
}

export function PlayerCard({ 
  player, 
  potValue, 
  onUpdatePotsTaken, 
  onUpdatePotsReturned,
  isEndingSession = false
}: PlayerCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#fff' : '#000';
  const cardBackgroundColor = isDark ? '#2c2c2e' : '#f2f2f7';
  const borderColor = isDark ? '#3a3a3c' : '#c7c7cc';
  const inputBackgroundColor = isDark ? '#3a3a3c' : '#e5e5ea';
  
  const [potsReturnedInput, setPotsReturnedInput] = useState(player.potsReturned.toString());

  React.useEffect(() => {
    setPotsReturnedInput(player.potsReturned.toString());
  }, [player.potsReturned]);

  const handleIncrementPotsTaken = () => {
    onUpdatePotsTaken(player.id, player.potsTaken + 1);
  };

  const handleDecrementPotsTaken = () => {
    if (player.potsTaken > 0) {
      onUpdatePotsTaken(player.id, player.potsTaken - 1);
    }
  };

  const handleIncrementPotsReturned = () => {
    onUpdatePotsReturned(player.id, player.potsReturned + 1);
    setPotsReturnedInput((player.potsReturned + 1).toString());
  };

  const handleDecrementPotsReturned = () => {
    if (player.potsReturned > 0) {
      onUpdatePotsReturned(player.id, player.potsReturned - 1);
      setPotsReturnedInput((player.potsReturned - 1).toString());
    }
  };

  const handleDecimalIncrement = (decimal: number) => {
    const newValue = Math.floor(player.potsReturned) + decimal;
    onUpdatePotsReturned(player.id, newValue);
    setPotsReturnedInput(newValue.toString());
  };

  const handlePotsReturnedInputChange = (text: string) => {
    setPotsReturnedInput(text);
    const numericValue = parseFloat(text);
    if (!isNaN(numericValue) && numericValue >= 0) {
      onUpdatePotsReturned(player.id, numericValue);
    }
  };

  const totalPotsTakenValue = player.potsTaken * potValue;
  const totalPotsReturnedValue = player.potsReturned * potValue;
  const netBalance = totalPotsReturnedValue - totalPotsTakenValue;

  return (
    <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
      <Text style={[styles.playerName, { color: textColor }]}>{player.name}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: textColor }]}>Pots Taken:</Text>
          {isEndingSession ? (
            <Text style={[styles.valueText, { color: textColor }]}>
              {player.potsTaken} (${totalPotsTakenValue.toFixed(2)})
            </Text>
          ) : (
            <>
              <View style={styles.counterContainer}>
                <TouchableOpacity 
                  onPress={handleDecrementPotsTaken}
                  style={[styles.counterButton, { borderColor }]}
                  disabled={player.potsTaken === 0}
                >
                  <Text style={[styles.counterButtonText, { color: textColor }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.counterValue, { color: textColor }]}>{player.potsTaken}</Text>
                <TouchableOpacity 
                  onPress={handleIncrementPotsTaken}
                  style={[styles.counterButton, { borderColor }]}
                >
                  <Text style={[styles.counterButtonText, { color: textColor }]}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.valueText, { color: textColor }]}>
                ${totalPotsTakenValue.toFixed(2)}
              </Text>
            </>
          )}
        </View>

        {isEndingSession && (
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: textColor }]}>Pots Returned:</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity 
                onPress={handleDecrementPotsReturned}
                style={[styles.counterButton, { borderColor }]}
                disabled={player.potsReturned === 0}
              >
                <Text style={[styles.counterButtonText, { color: textColor }]}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.potsReturnedInput, { 
                  backgroundColor: inputBackgroundColor, 
                  color: textColor,
                  borderColor
                }]}
                value={potsReturnedInput}
                onChangeText={handlePotsReturnedInputChange}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={isDark ? '#8e8e93' : '#c7c7cc'}
              />
              <TouchableOpacity 
                onPress={handleIncrementPotsReturned}
                style={[styles.counterButton, { borderColor }]}
              >
                <Text style={[styles.counterButtonText, { color: textColor }]}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.decimalButtonsContainer}>
              {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((decimal) => (
                <TouchableOpacity
                  key={decimal}
                  style={[styles.decimalButton, { borderColor }]}
                  onPress={() => handleDecimalIncrement(decimal)}
                >
                  <Text style={[styles.decimalButtonText, { color: textColor }]}>
                    +{decimal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.valueText, { color: textColor }]}>
              ${totalPotsReturnedValue.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {isEndingSession && (
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: textColor }]}>Net Balance:</Text>
          <Text 
            style={[
              styles.balanceValue, 
              { color: netBalance >= 0 ? (isDark ? '#32d74b' : '#34c759') : (isDark ? '#ff453a' : '#ff3b30') }
            ]}
          >
            ${Math.abs(netBalance).toFixed(2)} {netBalance >= 0 ? 'profit' : 'loss'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 12,
  },
  statItem: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 18,
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  potsReturnedInput: {
    fontSize: 18,
    marginHorizontal: 12,
    minWidth: 60,
    height: 36,
    textAlign: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  decimalButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  decimalButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  decimalButtonText: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 