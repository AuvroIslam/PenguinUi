import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

/** Vertical stack for laying out demo content. */
export function Col({
  children,
  gap = 14,
  align = 'center',
  style,
}: {
  children: ReactNode;
  gap?: number;
  align?: ViewStyle['alignItems'];
  style?: ViewStyle;
}) {
  return <View style={[{ gap, alignItems: align }, style]}>{children}</View>;
}

/** Horizontal stack for laying out demo content. */
export function Row({
  children,
  gap = 10,
  wrap = true,
  style,
}: {
  children: ReactNode;
  gap?: number;
  wrap?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap,
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
