import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  colors: any;
}

export const SkeletonInsightCard = ({ colors }: SkeletonCardProps) => {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width={40} height={40} borderRadius={12} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="60%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="100%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonBox width="80%" height={14} />
      </View>
    </View>
  );
};

export const SkeletonPlanCard = ({ colors }: SkeletonCardProps) => {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width={36} height={36} borderRadius={12} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="50%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonBox width="100%" height={12} style={{ marginBottom: 6 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <SkeletonBox width={60} height={12} style={{ marginRight: 8 }} />
          <SkeletonBox width={80} height={12} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
});
