/* Minimal runtime stand-in for `react-native` so the headless parallax logic and
 * the view components can be unit-tested with react-test-renderer in a plain Node
 * environment, without pulling in the native jest preset. Real `react-native`
 * types are still used for type-checking; only the runtime is mocked. */
import React from 'react';

function host(name: string) {
  return React.forwardRef(function HostComponent(
    props: Record<string, unknown>,
    ref: React.Ref<unknown>,
  ) {
    return React.createElement(name, { ...props, ref });
  });
}

export const View = host('View');
export const Text = host('Text');
export const TouchableOpacity = host('TouchableOpacity');
export const Pressable = host('Pressable');

/** A stand-in for `Animated.Value` that records interpolations. */
class AnimatedValue {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
  setValue(value: number) {
    this.value = value;
  }
  interpolate(config: unknown) {
    return { __interpolation: config };
  }
  addListener() {
    return '1';
  }
  removeListener() {}
  removeAllListeners() {}
}

const ScrollViewMock = React.forwardRef(function ScrollView(
  props: Record<string, unknown>,
  ref: React.Ref<unknown>,
) {
  React.useImperativeHandle(ref, () => ({ scrollTo() {} }), []);
  return React.createElement('Animated.ScrollView', props);
});

export const Animated = {
  View: host('Animated.View'),
  Text: host('Animated.Text'),
  ScrollView: ScrollViewMock,
  Value: AnimatedValue,
  event(_mapping: unknown, _config: unknown) {
    return () => {};
  },
  timing() {
    return {
      start(callback?: (result: { finished: boolean }) => void) {
        callback?.({ finished: true });
      },
    };
  },
};

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
  flatten(style: unknown) {
    return Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  },
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hairlineWidth: 1,
};

export const I18nManager = { isRTL: false };

export const AccessibilityInfo = {
  isReduceMotionEnabled() {
    return Promise.resolve(false);
  },
  addEventListener() {
    return { remove() {} };
  },
};

export default {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  StyleSheet,
  I18nManager,
  AccessibilityInfo,
};
