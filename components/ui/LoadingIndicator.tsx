import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function LoadingIndicator({ 
  size = 'medium', 
  color = '#F97966' 
}: LoadingIndicatorProps) {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeStyles = {
    small: { width: 20, height: 20, borderWidth: 2 },
    medium: { width: 32, height: 32, borderWidth: 3 },
    large: { width: 48, height: 48, borderWidth: 4 },
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          sizeStyles[size],
          { borderColor: `${color}20`, borderTopColor: color },
          { transform: [{ rotate: spin }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    borderRadius: 50,
  },
});