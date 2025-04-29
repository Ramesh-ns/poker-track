import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  disabled = false 
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#444' : '#ccc';
    
    switch (variant) {
      case 'primary':
        return isDark ? '#0a84ff' : '#007aff';
      case 'secondary':
        return isDark ? '#2c2c2e' : '#e5e5ea';
      case 'danger':
        return isDark ? '#ff453a' : '#ff3b30';
      default:
        return isDark ? '#0a84ff' : '#007aff';
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? '#888' : '#666';
    
    switch (variant) {
      case 'primary':
        return '#fff';
      case 'secondary':
        return isDark ? '#fff' : '#000';
      case 'danger':
        return '#fff';
      default:
        return '#fff';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 