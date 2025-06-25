import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TouchableHighlight, Pressable, Alert, Button, StyleSheet, Platform } from 'react-native';

export default function TestScreen() {
  const [touchCount, setTouchCount] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    // Log device information
    const info = {
      platform: Platform.OS,
      version: Platform.Version,
      isTV: Platform.isTV,
      isTesting: __DEV__,
    };
    console.log('Device Info:', info);
    setDeviceInfo(JSON.stringify(info, null, 2));
  }, []);

  const handleTouch = (type: string) => {
    console.log(`${type} touched!`);
    setTouchCount(prev => prev + 1);
    Alert.alert('Touch Detected', `${type} was touched! Count: ${touchCount + 1}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Touch Test Screen</Text>
      <Text style={styles.subtitle}>Touch Count: {touchCount}</Text>
      
      {/* Device Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Device Information:</Text>
        <Text style={styles.infoText}>{deviceInfo}</Text>
      </View>
      
      {/* Test 1: Basic TouchableOpacity */}
      <TouchableOpacity
        style={styles.redButton}
        onPress={() => handleTouch('TouchableOpacity')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>TouchableOpacity</Text>
      </TouchableOpacity>

      {/* Test 2: Pressable */}
      <Pressable
        style={styles.blueButton}
        onPress={() => handleTouch('Pressable')}
        onPressIn={() => console.log('Pressable pressed in')}
        onPressOut={() => console.log('Pressable pressed out')}
      >
        <Text style={styles.buttonText}>Pressable</Text>
      </Pressable>

      {/* Test 3: TouchableHighlight */}
      <TouchableHighlight
        style={styles.greenButton}
        onPress={() => handleTouch('TouchableHighlight')}
        underlayColor="darkgreen"
      >
        <Text style={styles.buttonText}>TouchableHighlight</Text>
      </TouchableHighlight>

      {/* Test 4: Native Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Native Button"
          onPress={() => handleTouch('Native Button')}
          color="purple"
        />
      </View>

      {/* Test 5: Simple View with onTouchStart */}
      <View 
        style={styles.yellowButton}
        onTouchStart={() => handleTouch('View onTouchStart')}
      >
        <Text style={styles.buttonText}>View onTouchStart</Text>
      </View>
      
      <Text style={styles.instruction}>
        Try all buttons above. If none work, there's a device/simulator issue.
      </Text>
      
      <Text style={styles.browserNote}>
        💡 Tip: Try the web version at http://localhost:8081 - it works perfectly!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: 'gray',
  },
  infoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  redButton: {
    backgroundColor: 'red',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: 200,
    alignItems: 'center',
  },
  blueButton: {
    backgroundColor: 'blue',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: 200,
    alignItems: 'center',
  },
  greenButton: {
    backgroundColor: 'green',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: 200,
    alignItems: 'center',
  },
  yellowButton: {
    backgroundColor: 'orange',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: 200,
    alignItems: 'center',
  },
  buttonContainer: {
    marginBottom: 15,
    width: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  browserNote: {
    fontSize: 14,
    color: 'blue',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
}); 