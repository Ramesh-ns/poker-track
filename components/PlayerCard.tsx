import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
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
  onDeletePlayer: (playerId: string) => Promise<void>;
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
  
  // Track individual pot additions for calculation display
  // Initialize from current potsTaken value
  const [potHistory, setPotHistory] = useState<number[]>(() => {
    // If player already has pots taken, we need to reconstruct history
    // For fixed mode: potsTaken is the count, so create array of 1s
    // For direct mode: potsTaken is the total amount, we'll need to track from now on
    if (player.potsTaken > 0) {
      if (potMode === 'fixed') {
        // For fixed mode, each pot is 1, so create array of 1s
        return Array(Math.floor(player.potsTaken)).fill(1);
      } else {
        // For direct mode, we can't perfectly reconstruct history, but we can
        // try to divide by potValue to get an estimate, or start fresh
        // Starting fresh is safer - user can continue adding from current total
        return [];
      }
    }
    return [];
  });

  // Input value for pots taken (temporary, not saved until + button is clicked)
  const [potsTakenInput, setPotsTakenInput] = useState<string>('');

  // Sync pot history when player changes or when potsTaken changes externally
  useEffect(() => {
    // Only update if our calculated total doesn't match player.potsTaken
    const calculatedTotal = potHistory.reduce((sum, val) => sum + val, 0);
    if (Math.abs(calculatedTotal - player.potsTaken) > 0.01) {
      // There's a mismatch - update history
      if (potMode === 'fixed' && player.potsTaken > 0) {
        setPotHistory(Array(Math.floor(player.potsTaken)).fill(1));
      } else if (potMode === 'direct' && player.potsTaken > 0 && potHistory.length === 0) {
        // For direct mode, if we have no history but player has potsTaken,
        // we can't reconstruct perfectly, so keep empty history
        // The display will show the current total from player.potsTaken
      }
    }
  }, [player.potsTaken, player.id, potMode]);

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

  // Handle adding a pot (button click) - reads value from input
  const handleAddPot = () => {
    // Get the value from the input field
    const inputValue = parseFloat(potsTakenInput) || 0;
    
    if (inputValue <= 0) {
      // Don't add if input is empty or invalid
      return;
    }
    
    // Add the input value to history
    const newHistory = [...potHistory, inputValue];
    setPotHistory(newHistory);
    
    // Calculate total from history
    const total = newHistory.reduce((sum, val) => sum + val, 0);
    onUpdatePotsTaken(player.id, total);
    
    // Clear the input for next entry
    setPotsTakenInput('');
  };

  // Handle manual input change for pots taken (just updates local state, doesn't save)
  const handlePotsTakenInputChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setPotsTakenInput(cleanedText);
  };

  // Calculate total from pot history
  const calculatedPotsTaken = potHistory.reduce((sum, val) => sum + val, 0);
  
  // Display the calculated total (from history), not the input value
  const displayPotsTaken = calculatedPotsTaken;
  
  // Generate calculation string
  const getCalculationString = (): string => {
    if (potHistory.length === 0) {
      return 'Total: 0';
    }
    
    const total = potHistory.reduce((sum, val) => sum + val, 0);
    
    // If only one entry, just show the value without calculation
    if (potHistory.length === 1) {
      if (potMode === 'fixed') {
        return `Total: ${total}`;
      } else {
        return `Total: $${total.toFixed(2)}`;
      }
    }
    
    // If multiple entries, show calculation with equals
    // Format: Total: $25+$25 = $50
    if (potMode === 'fixed') {
      // Show as: Total: 1+2+1 = 4 (pot count, not dollar amount)
      const calculation = potHistory.join('+');
      return `Total: ${calculation} = ${total}`;
    } else {
      // Show as: Total: $25.00+$25.00 = $50.00
      const calculation = potHistory.map(val => `$${val.toFixed(2)}`).join('+');
      return `Total: ${calculation} = $${total.toFixed(2)}`;
    }
  };

  const handleDeletePlayer = () => {
    // Only allow deletion if no pots/amount have been taken
    if (calculatedPotsTaken > 0) {
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${player.name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeletePlayer(player.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete player. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Check if player can be deleted (only if no pots/amount taken)
  const canDeletePlayer = calculatedPotsTaken === 0;

  // Calculate values based on pot mode
  // Use calculatedPotsTaken from history
  const totalPotsTakenValue = potMode === 'direct' 
    ? calculatedPotsTaken 
    : calculatedPotsTaken * potValue;
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
            style={[
              styles.deleteButton,
              !canDeletePlayer && styles.deleteButtonDisabled
            ]}
            onPress={handleDeletePlayer}
            disabled={!canDeletePlayer}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={canDeletePlayer ? negativeColor : (isDark ? '#666' : '#999')} 
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.potsContainer}>
        <View style={styles.potSection}>
          <Text style={[styles.potLabel, { color: textColor }]}>
            {potMode === 'direct' ? 'Amount Taken' : 'Pots Taken'}
          </Text>
          {!isReadOnly ? (
            <>
              <View style={styles.potInputContainer}>
                <TextInput
                  style={[
                    styles.potsTakenInput, 
                    { 
                      color: textColor, 
                      borderColor: borderColor 
                    }
                  ]}
                  value={potsTakenInput}
                  onChangeText={handlePotsTakenInputChange}
                  keyboardType="decimal-pad"
                  placeholder={potMode === 'direct' ? "Enter amount" : "Enter pots"}
                />
                <TouchableOpacity
                  style={[
                    styles.addPotButtonSmall, 
                    { 
                      backgroundColor: positiveColor,
                      opacity: (parseFloat(potsTakenInput) || 0) > 0 ? 1 : 0.5
                    }
                  ]}
                  onPress={handleAddPot}
                  disabled={(parseFloat(potsTakenInput) || 0) <= 0}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              {potHistory.length > 0 && (
                <View style={[styles.calculationContainer, { backgroundColor: buttonBackgroundColor }]}>
                  <Text style={[styles.calculationText, { color: textColor }]}>
                    {getCalculationString()}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.readOnlyContainer}>
              {potMode === 'fixed' ? (
                <>
                  <Text style={[styles.potValue, { color: textColor }]}>{displayPotsTaken.toString()}</Text>
                  <Text style={[styles.potAmount, { color: textColor }]}>
                    {'$' + totalPotsTakenValue.toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text style={[styles.potAmount, { color: textColor, fontSize: 18 }]}>
                  {'$' + totalPotsTakenValue.toFixed(2)}
                </Text>
              )}
            </View>
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
  deleteButtonDisabled: {
    opacity: 0.4,
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
  potInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  potsTakenInput: {
    flex: 1,
    fontSize: 18,
    height: 44,
    textAlign: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  addPotButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculationContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  calculationText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    fontStyle: 'italic',
  },
}); 