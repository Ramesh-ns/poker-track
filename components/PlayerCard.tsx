import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { Player } from '../types/poker';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';

interface PlayerCardProps {
  player: Player;
  potValue: number;
  potMode: 'fixed' | 'direct';
  onUpdatePotsTaken: (playerId: string, value: number) => void;
  onUpdatePotsReturned: (playerId: string, value: number) => void;
  onDeletePlayer: (playerId: string) => void;
  isEndingSession: boolean;
  isReadOnly?: boolean;
}

export function PlayerCard({ 
  player, 
  potValue, 
  potMode,
  onUpdatePotsTaken, 
  onUpdatePotsReturned,
  onDeletePlayer,
  isEndingSession,
  isReadOnly = false 
}: PlayerCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const cardBackgroundColor = isDark ? '#1c1c1e' : '#ffffff';
  const borderColor = isDark ? '#38383a' : '#e5e5ea';
  const buttonBackgroundColor = isDark ? '#2c2c2e' : '#f2f2f7';
  const positiveColor = isDark ? '#32d74b' : '#34c759';
  const negativeColor = isDark ? '#ff453a' : '#ff3b30';
  const warningColor = isDark ? '#ffcc00' : '#ff9500';
  
  const [potsReturnedInput, setPotsReturnedInput] = useState<string>(
    (player.potsReturned !== undefined && player.potsReturned !== null) 
      ? player.potsReturned.toString() 
      : ''
  );
  
  const [potsTakenInput, setPotsTakenInput] = useState<string>(
    player.potsTaken.toString()
  );

  // Sync local state with player data
  useEffect(() => {
    setPotsTakenInput(player.potsTaken.toString());
  }, [player.potsTaken]);

  useEffect(() => {
    setPotsReturnedInput(
      (player.potsReturned !== undefined && player.potsReturned !== null) 
        ? player.potsReturned.toString() 
        : ''
    );
  }, [player.potsReturned]);

  const isPotsReturnedValid = !isEndingSession || (
    potsReturnedInput !== '' && 
    !isNaN(parseFloat(potsReturnedInput)) && 
    parseFloat(potsReturnedInput) >= 0
  );

  const calculateNetBalance = (potsTaken: number, potsReturned: number | undefined): number => {
    return potsTaken - (potsReturned ?? 0);
  };

  const currentNetBalance = calculateNetBalance(player.potsTaken, player.potsReturned);

  const handlePotsReturnedInputChange = (text: string) => {
    setPotsReturnedInput(text);
    if (text === '') {
      onUpdatePotsReturned(player.id, 0);
      return;
    }
    const numericValue = parseFloat(text);
    if (!isNaN(numericValue) && numericValue >= 0) {
      onUpdatePotsReturned(player.id, numericValue);
    }
  };

  const handleDecimalIncrement = (decimal: number) => {
    const currentValue = potsReturnedInput === '' ? 0 : parseFloat(potsReturnedInput);
    const newValue = Math.floor(currentValue) + decimal;
    onUpdatePotsReturned(player.id, newValue);
    setPotsReturnedInput(newValue.toString());
  };

  const handleIncrementPotsReturned = () => {
    const currentValue = parseFloat(potsReturnedInput) || 0;
    const newValue = currentValue + 1;
    setPotsReturnedInput(newValue.toString());
    onUpdatePotsReturned(player.id, newValue);
  };

  const handleDecrementPotsReturned = () => {
    const currentValue = parseFloat(potsReturnedInput) || 0;
    if (currentValue > 0) {
      const newValue = currentValue - 1;
      setPotsReturnedInput(newValue.toString());
      onUpdatePotsReturned(player.id, newValue);
    }
  };

  const handleIncrementPotsTaken = () => {
    const currentValue = parseFloat(potsTakenInput) || 0;
    const newValue = currentValue + 1;
    setPotsTakenInput(newValue.toString());
    onUpdatePotsTaken(player.id, newValue);
  };

  const handleDecrementPotsTaken = () => {
    const currentValue = parseFloat(potsTakenInput) || 0;
    if (currentValue > 0) {
      const newValue = currentValue - 1;
      setPotsTakenInput(newValue.toString());
      onUpdatePotsTaken(player.id, newValue);
    }
  };

  const handleDeletePlayer = () => {
    onDeletePlayer(player.id);
  };

  // Calculate values based on pot mode
  const totalPotsTakenValue = potMode === 'direct' 
    ? player.potsTaken 
    : player.potsTaken * potValue;
  const totalPotsReturnedValue = potMode === 'direct'
    ? (player.potsReturned ?? 0)
    : (player.potsReturned ?? 0) * potValue;
  const netBalance = totalPotsReturnedValue - totalPotsTakenValue;
  const isProfit = totalPotsReturnedValue > totalPotsTakenValue;

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: cardBackgroundColor, 
        borderColor: isEndingSession && !isPotsReturnedValid ? warningColor : borderColor 
      }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.playerName, { color: textColor }]}>{player.name}</Text>
        {!isReadOnly && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeletePlayer}
          >
            <Ionicons name="trash-outline" size={20} color={negativeColor} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.potsContainer}>
        <View style={styles.potSection}>
          <Text style={[styles.potLabel, { color: textColor }]}>
            {potMode === 'direct' ? 'Amount Taken' : 'Pots Taken'}
          </Text>
          {potMode === 'direct' ? (
            // Direct mode: Show dollar amount input with text field
            !isReadOnly ? (
              <>
                <View style={styles.potControls}>
                  <TouchableOpacity
                    style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                    onPress={handleDecrementPotsTaken}
                  >
                    <Ionicons name="remove" size={20} color={textColor} />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.potsReturnedInput, 
                      { 
                        color: textColor, 
                        borderColor: borderColor 
                      }
                    ]}
                    value={potsTakenInput}
                    onChangeText={(text) => {
                      setPotsTakenInput(text);
                      const numericValue = parseFloat(text) || 0;
                      onUpdatePotsTaken(player.id, numericValue);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                  <TouchableOpacity
                    style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                    onPress={handleIncrementPotsTaken}
                  >
                    <Ionicons name="add" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={[styles.potAmount, { color: textColor, fontSize: 18 }]}>
                {'$' + totalPotsTakenValue.toFixed(2)}
              </Text>
            )
          ) : (
            // Fixed mode: Show pot count and dollar amount
            <>
              {!isReadOnly ? (
                <View style={styles.potControls}>
                  <TouchableOpacity
                    style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                    onPress={handleDecrementPotsTaken}
                  >
                    <Ionicons name="remove" size={20} color={textColor} />
                  </TouchableOpacity>
                  <Text style={[styles.potValue, { color: textColor }]}>{player.potsTaken.toString()}</Text>
                  <TouchableOpacity
                    style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                    onPress={handleIncrementPotsTaken}
                  >
                    <Ionicons name="add" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.readOnlyContainer}>
                  <Text style={[styles.potValue, { color: textColor }]}>{player.potsTaken.toString()}</Text>
                  <Text style={[styles.potAmount, { color: textColor }]}>
                    {'$' + totalPotsTakenValue.toFixed(2)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.potSection}>
          <View style={styles.potLabelContainer}>
            <Text style={[styles.potLabel, { color: textColor }]}>
              {potMode === 'direct' ? 'Amount Returned' : 'Pots Returned'}
            </Text>
            {isEndingSession && !isPotsReturnedValid && (
              <Text style={[styles.warningText, { color: warningColor }]}>
                Required
              </Text>
            )}
          </View>
          {potMode === 'direct' ? (
            // Direct mode: Show dollar amount input
            !isReadOnly ? (
              <>
                <View style={styles.potControls}>
                  <TouchableOpacity
                    style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                    onPress={handleDecrementPotsReturned}
                  >
                    <Ionicons name="remove" size={20} color={textColor} />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.potsReturnedInput, 
                      { 
                        color: textColor, 
                        borderColor: isEndingSession && !isPotsReturnedValid ? warningColor : borderColor 
                      }
                    ]}
                    value={potsReturnedInput}
                    onChangeText={handlePotsReturnedInputChange}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                  <TouchableOpacity
                    style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                    onPress={handleIncrementPotsReturned}
                  >
                    <Ionicons name="add" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={[styles.potAmount, { color: textColor, fontSize: 18 }]}>
                {'$' + totalPotsReturnedValue.toFixed(2)}
              </Text>
            )
          ) : (
            // Fixed mode: Show pot count and dollar amount
            <>
              {!isReadOnly ? (
                <>
                  <View style={styles.potControls}>
                    <TouchableOpacity
                      style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                      onPress={handleDecrementPotsReturned}
                    >
                      <Ionicons name="remove" size={20} color={textColor} />
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.potsReturnedInput, 
                        { 
                          color: textColor, 
                          borderColor: isEndingSession && !isPotsReturnedValid ? warningColor : borderColor 
                        }
                      ]}
                      value={potsReturnedInput}
                      onChangeText={handlePotsReturnedInputChange}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                    <TouchableOpacity
                      style={[styles.potButton, { backgroundColor: buttonBackgroundColor }]}
                      onPress={handleIncrementPotsReturned}
                    >
                      <Ionicons name="add" size={20} color={textColor} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.decimalButtonsContainer}>
                    {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(decimal => (
                      <TouchableOpacity
                        key={decimal}
                        style={[styles.decimalButton, { backgroundColor: buttonBackgroundColor, borderColor }]}
                        onPress={() => handleDecimalIncrement(decimal)}
                      >
                        <Text style={[styles.decimalButtonText, { color: textColor }]}>
                          +{decimal.toString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.readOnlyContainer}>
                  <Text style={[styles.potValue, { color: textColor }]}>{(player.potsReturned ?? 0).toString()}</Text>
                  <Text style={[styles.potAmount, { color: textColor }]}>
                    {'$' + totalPotsReturnedValue.toFixed(2)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.netBalanceContainer}>
        <Text style={[styles.netBalanceLabel, { color: textColor }]}>Net Balance</Text>
        <Text style={[
          styles.netBalanceValue,
          { color: isProfit ? positiveColor : negativeColor }
        ]}>
          {'$' + Math.abs(netBalance).toFixed(2)} {isProfit ? 'profit' : 'loss'}
        </Text>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deleteButton: {
    padding: 8,
  },
  potsContainer: {
    marginBottom: 12,
  },
  potSection: {
    marginBottom: 8,
  },
  potLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  potControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  potButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  potValue: {
    fontSize: 18,
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  potAmount: {
    fontSize: 16,
  },
  readOnlyContainer: {
    alignItems: 'flex-start',
  },
  potLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
  },
  netBalanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3c',
  },
  netBalanceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  netBalanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 