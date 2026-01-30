import React, { ReactNode } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Platform
} from 'react-native';
import { useColorScheme } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string | ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#fff' : '#000';
  const borderColor = error
    ? (isDark ? '#ff453a' : '#ff3b30')
    : (isDark ? '#3a3a3c' : '#c7c7cc');
  const backgroundColor = isDark ? '#1c1c1e' : '#f2f2f7';
  const placeholderColor = isDark ? '#8e8e93' : '#c7c7cc';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        typeof label === 'string' ? (
          <Text style={[styles.label, { color: textColor }, labelStyle]}>
            {label}
          </Text>
        ) : (
          <View style={[styles.label]}>
            {label}
          </View>
        )
      )}
      <TextInput
        style={[
          styles.input,
          {
            color: textColor,
            borderColor,
            backgroundColor,
            // Consistency fix: ensure secureTextEntry doesn't change font to monospace
            fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
          },
          inputStyle,
        ]}
        placeholderTextColor={placeholderColor}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: isDark ? '#ff453a' : '#ff3b30' }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
}); 