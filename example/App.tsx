import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ParallaxOnboarding,
  type OnboardingController,
  type OnboardingPage,
} from 'react-native-onboarding-parallax';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface Slide {
  icon: IconName;
  title: string;
  body: string;
  accent: string;
  top: string;
  bottom: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'layers',
    title: 'Depth in every swipe',
    body: 'Each layer drifts at its own pace, so the screen feels three-dimensional as you move.',
    accent: '#6C8CFF',
    top: '#2B3A67',
    bottom: '#0B1026',
  },
  {
    icon: 'swipe',
    title: 'Swipe or tap',
    body: 'Drag the pages, tap Next, or drive it from your own buttons through the controller ref.',
    accent: '#36D6C3',
    top: '#0E5A52',
    bottom: '#05201D',
  },
  {
    icon: 'accessibility-new',
    title: 'Built for everyone',
    body: 'Reduce-motion freezes the parallax and right-to-left mirrors it, with zero extra work.',
    accent: '#B388FF',
    top: '#4A2A6B',
    bottom: '#1A0E2B',
  },
  {
    icon: 'rocket-launch',
    title: 'Ready to ship',
    body: 'Slot in your own pages, indicators, and chrome, then listen with onDone and onSkip.',
    accent: '#FFB270',
    top: '#8A4B1F',
    bottom: '#2B1206',
  },
];

const ADVANCE_MS = 2200;

function buildPages(): OnboardingPage[] {
  return SLIDES.map((slide) => ({
    backgroundFactor: -0.35,
    contentFactor: 0,
    foregroundFactor: 0.6,
    foregroundAlign: 'bottomRight',
    background: (
      <LinearGradient
        colors={[slide.top, slide.bottom]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.background}
      />
    ),
    foreground: (
      <MaterialIcons
        name={slide.icon}
        size={240}
        color={slide.accent}
        style={styles.ghost}
      />
    ),
    content: (
      <View style={styles.content}>
        <View
          style={[
            styles.badge,
            { borderColor: slide.accent, backgroundColor: `${slide.accent}22` },
          ]}
        >
          <MaterialIcons name={slide.icon} size={72} color={slide.accent} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
    ),
  }));
}

export default function App() {
  const controller = useRef<OnboardingController>(null);

  // Auto-play: ping-pong across the slides so the parallax keeps moving on its
  // own for the demo. A real app would just let the user drive it.
  useEffect(() => {
    let direction = 1;
    const id = setInterval(() => {
      const flow = controller.current;
      if (!flow) return;
      const last = SLIDES.length - 1;
      if (flow.index >= last) direction = -1;
      else if (flow.index <= 0) direction = 1;
      flow.goTo(flow.index + direction);
    }, ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ParallaxOnboarding
        ref={controller}
        pages={buildPages()}
        tintColor="#FFFFFF"
        onDone={() => controller.current?.goTo(0)}
        onSkip={() => controller.current?.goTo(0)}
      />
    </View>
  );
}

const OVERSCAN = 180;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060D',
  },
  background: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -OVERSCAN,
    right: -OVERSCAN,
  },
  ghost: {
    opacity: 0.16,
    marginRight: 8,
    marginBottom: 96,
  },
  content: {
    // Fill the page width so the text wraps inside the page. Without this the
    // View shrink-wraps and iOS lets a long line overflow the right edge.
    alignSelf: 'stretch',
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  badge: {
    width: 132,
    height: 132,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  title: {
    alignSelf: 'stretch',
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    alignSelf: 'stretch',
    color: 'rgba(255,255,255,0.74)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
