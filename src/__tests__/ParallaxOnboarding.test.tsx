import { createRef } from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { Text, View } from 'react-native';

import {
  ParallaxOnboarding,
  type OnboardingController,
} from '../ParallaxOnboarding';
import type { OnboardingPage } from '../OnboardingPage';

function buildPages(n = 3): OnboardingPage[] {
  return Array.from({ length: n }, (_, i) => ({
    background: <View />,
    content: <Text>{`Page ${i}`}</Text>,
    foreground: <View />,
  }));
}

function hasText(root: ReactTestInstance, label: string): boolean {
  return (
    root.findAll(
      (node) => (node.type as unknown) === 'Text' && nodeHasChild(node, label),
    ).length > 0
  );
}

function nodeHasChild(node: ReactTestInstance, label: string): boolean {
  const children = node.props.children;
  return children === label || (Array.isArray(children) && children.includes(label));
}

function pressButton(root: ReactTestInstance, label: string): void {
  const button = root
    .findAll((node) => (node.type as unknown) === 'TouchableOpacity')
    .find(
      (candidate) =>
        candidate.findAll(
          (node) => (node.type as unknown) === 'Text' && nodeHasChild(node, label),
        ).length > 0,
    );
  if (!button) throw new Error(`No button labelled "${label}"`);
  act(() => {
    (button.props.onPress as () => void)();
  });
}

function simulateLayout(
  root: ReactTestInstance,
  width: number,
  height: number,
): void {
  const container = root.find(
    (node) =>
      (node.type as unknown) === 'View' &&
      typeof node.props.onLayout === 'function',
  );
  act(() => {
    container.props.onLayout({ nativeEvent: { layout: { width, height } } });
  });
}

function layersWithTransform(root: ReactTestInstance): ReactTestInstance[] {
  return root.findAll((node) => {
    if ((node.type as unknown) !== 'Animated.View') return false;
    const styles = ([] as unknown[]).concat(node.props.style);
    // A parallax layer is an absolutely-positioned Animated.View carrying a
    // transform - this excludes the indicator dots, which also use a transform.
    const hasTransform = styles.some(
      (s) => !!s && typeof s === 'object' && Array.isArray((s as { transform?: unknown }).transform),
    );
    const isLayer = styles.some(
      (s) => !!s && typeof s === 'object' && (s as { position?: string }).position === 'absolute',
    );
    return hasTransform && isLayer;
  });
}

function dotCount(root: ReactTestInstance): number {
  return root.findAll((node) => {
    if ((node.type as unknown) !== 'Animated.View') return false;
    const styles = ([] as unknown[]).concat(node.props.style);
    return styles.some(
      (s) => !!s && typeof s === 'object' && (s as { borderRadius?: number }).borderRadius === 4,
    );
  }).length;
}

describe('ParallaxOnboarding', () => {
  test('shows the first page and its controls', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<ParallaxOnboarding pages={buildPages()} />);
    });
    const root = renderer.root;
    expect(hasText(root, 'Page 0')).toBe(true);
    expect(hasText(root, 'Skip')).toBe(true);
    expect(hasText(root, 'Next')).toBe(true);
    expect(hasText(root, 'Done')).toBe(false);
  });

  test('renders one indicator dot per page', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<ParallaxOnboarding pages={buildPages(4)} />);
    });
    expect(dotCount(renderer.root)).toBe(4);
  });

  test('the controller advances and reports the index', () => {
    const ref = createRef<OnboardingController>();
    const changes: number[] = [];
    act(() => {
      TestRenderer.create(
        <ParallaxOnboarding
          ref={ref}
          pages={buildPages()}
          onIndexChange={(i) => changes.push(i)}
        />,
      );
    });

    act(() => ref.current!.next());
    expect(ref.current!.index).toBe(1);
    expect(changes).toContain(1);

    act(() => ref.current!.previous());
    expect(ref.current!.index).toBe(0);
  });

  test('clamps navigation to the page range', () => {
    const ref = createRef<OnboardingController>();
    act(() => {
      TestRenderer.create(<ParallaxOnboarding ref={ref} pages={buildPages()} />);
    });
    act(() => ref.current!.previous());
    expect(ref.current!.index).toBe(0);
    act(() => ref.current!.goTo(99));
    expect(ref.current!.index).toBe(2);
  });

  test('shows Done on the last page and invokes onDone', () => {
    const ref = createRef<OnboardingController>();
    let done = 0;
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ParallaxOnboarding ref={ref} pages={buildPages()} onDone={() => done++} />,
      );
    });

    act(() => ref.current!.goTo(2));
    const root = renderer.root;
    expect(hasText(root, 'Done')).toBe(true);
    expect(hasText(root, 'Next')).toBe(false);

    pressButton(root, 'Done');
    expect(done).toBe(1);
  });

  test('invokes onSkip when Skip is tapped', () => {
    let skipped = 0;
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ParallaxOnboarding pages={buildPages()} onSkip={() => skipped++} />,
      );
    });
    pressButton(renderer.root, 'Skip');
    expect(skipped).toBe(1);
  });

  test('tapping Next advances the page', () => {
    const ref = createRef<OnboardingController>();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ParallaxOnboarding ref={ref} pages={buildPages()} />,
      );
    });
    pressButton(renderer.root, 'Next');
    expect(ref.current!.index).toBe(1);
  });

  test('applies parallax transforms once laid out', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<ParallaxOnboarding pages={buildPages()} />);
    });
    simulateLayout(renderer.root, 300, 600);
    expect(layersWithTransform(renderer.root).length).toBeGreaterThan(0);
  });

  test('reduced motion freezes the parallax layers', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ParallaxOnboarding pages={buildPages()} reduceMotion />,
      );
    });
    simulateLayout(renderer.root, 300, 600);
    expect(layersWithTransform(renderer.root).length).toBe(0);
  });
});
