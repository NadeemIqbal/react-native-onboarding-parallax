import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  I18nManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { alignToFlex, type LayerAlign, type OnboardingPage } from './OnboardingPage';
import type { Axis } from './parallax';

function clamp(value: number, lower: number, upper: number): number {
  if (upper < lower) return lower;
  return Math.min(Math.max(value, lower), upper);
}

/** The exact result of `Animated.Value.interpolate`, used in layer transforms. */
type AnimatedInterpolationResult = ReturnType<Animated.Value['interpolate']>;

/** A single-axis parallax transform list (empty when the layer is frozen). */
type LayerTransform = Array<
  | { translateX: AnimatedInterpolationResult }
  | { translateY: AnimatedInterpolationResult }
>;

/**
 * Imperative handle for a {@link ParallaxOnboarding}, exposed through its `ref`.
 * Use it to drive the flow from outside - custom buttons, deep links, analytics.
 */
export interface OnboardingController {
  /** Advances to the next page. */
  next(): void;
  /** Returns to the previous page. */
  previous(): void;
  /** Animates (or jumps, when `animated` is false) to `index`, clamped. */
  goTo(index: number, animated?: boolean): void;
  /** The current settled page index. */
  readonly index: number;
}

/**
 * State handed to {@link ParallaxOnboardingProps.renderControls} and
 * {@link ParallaxOnboardingProps.renderIndicator} so custom chrome can mirror
 * the built-in behaviour and animate against the live scroll position.
 */
export interface OnboardingRenderState {
  index: number;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  /** Live scroll position in pixels along the paging axis (native-driver). */
  scrollPosition: Animated.Value;
  /** Size of one page along the paging axis, in pixels. */
  pageExtent: number;
  axis: Axis;
  rtl: boolean;
  tintColor: string;
  next(): void;
  previous(): void;
  goTo(index: number, animated?: boolean): void;
  skip(): void;
  done(): void;
}

/** Props for {@link ParallaxOnboarding}. */
export interface ParallaxOnboardingProps {
  /** The pages to display, back layer first. */
  pages: OnboardingPage[];
  /** Scroll axis for paging. Defaults to `'horizontal'`. */
  axis?: Axis;
  /** Page shown when the carousel first mounts. Defaults to `0`. */
  initialIndex?: number;
  /** Called when the user taps the done button on the last page. */
  onDone?: () => void;
  /** Called when the user taps skip. */
  onSkip?: () => void;
  /** Called with the new settled page index whenever it changes. */
  onIndexChange?: (index: number) => void;
  /** Whether the skip button is shown (on every page but the last). */
  showSkip?: boolean;
  /** Label for the skip button. Defaults to `'Skip'`. */
  skipLabel?: string;
  /** Label for the next button. Defaults to `'Next'`. */
  nextLabel?: string;
  /** Label for the done button shown on the last page. Defaults to `'Done'`. */
  doneLabel?: string;
  /** Full-bleed node painted behind every page, for a shared gradient or color. */
  background?: ReactNode;
  /** Colour for the default dots and control labels. Defaults to white. */
  tintColor?: string;
  /**
   * Forces reduced motion on (`true`) or off (`false`). When undefined the
   * carousel reads the platform's "reduce motion" accessibility setting.
   */
  reduceMotion?: boolean;
  /** Mirror horizontal motion for RTL. Defaults to `I18nManager.isRTL`. */
  rtl?: boolean;
  /** Replaces the default dot indicator. */
  renderIndicator?: (state: OnboardingRenderState) => ReactNode;
  /** Replaces the whole default control bar (skip, dots, next/done). */
  renderControls?: (state: OnboardingRenderState) => ReactNode;
  /** Style for the outer container. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Builds the native-driver transform for one parallax layer as a function of the
 * shared scroll position. Returns an empty array (no transform) when there is
 * nothing to move.
 */
function layerTransform(
  scrollPosition: Animated.Value,
  pageIndex: number,
  factor: number,
  extent: number,
  axis: Axis,
  rtl: boolean,
): LayerTransform {
  if (extent <= 0 || factor === 0) return [];
  const sign = axis === 'horizontal' && rtl ? -1 : 1;
  // translate(offset) = factor * sign * (offset - pageIndex * extent), a line in
  // the scroll offset, so two points fully describe it.
  const at0 = -factor * sign * pageIndex * extent;
  const atExtent = factor * sign * extent * (1 - pageIndex);
  const interpolation = scrollPosition.interpolate({
    inputRange: [0, extent],
    outputRange: [at0, atExtent],
    extrapolate: 'extend',
  });
  return axis === 'horizontal'
    ? [{ translateX: interpolation }]
    : [{ translateY: interpolation }];
}

/**
 * A batteries-included, swipeable onboarding carousel whose layers move with
 * parallax depth.
 *
 * Give it a list of {@link OnboardingPage}s and listen with `onDone` / `onSkip`:
 *
 * ```tsx
 * <ParallaxOnboarding
 *   pages={[
 *     { background: <Bg />, content: <Text>Welcome</Text>, foreground: <Art /> },
 *     // ...more pages
 *   ]}
 *   onDone={() => navigation.replace('Home')}
 *   onSkip={() => navigation.replace('Home')}
 * />
 * ```
 *
 * It honours the platform "reduce motion" setting (dropping the parallax) and
 * `I18nManager.isRTL` (mirroring horizontal motion). For full control pass a
 * `ref` to drive it imperatively, or swap `renderIndicator` / `renderControls`,
 * or drop down to the {@link ParallaxLayer} primitive in your own pager.
 */
export const ParallaxOnboarding = forwardRef<OnboardingController, ParallaxOnboardingProps>(
  function ParallaxOnboarding(
    {
      pages,
      axis = 'horizontal',
      initialIndex = 0,
      onDone,
      onSkip,
      onIndexChange,
      showSkip = true,
      skipLabel = 'Skip',
      nextLabel = 'Next',
      doneLabel = 'Done',
      background,
      tintColor = '#FFFFFF',
      reduceMotion: reduceMotionProp,
      rtl: rtlProp,
      renderIndicator,
      renderControls,
      style,
    },
    ref,
  ) {
    const count = pages.length;
    const scrollRef = useRef<ScrollView>(null);
    const scrollPosition = useRef(new Animated.Value(initialIndex)).current;
    const indexRef = useRef(clamp(initialIndex, 0, Math.max(0, count - 1)));
    const [index, setIndex] = useState(indexRef.current);
    const [size, setSize] = useState({ width: 0, height: 0 });

    const extent = axis === 'horizontal' ? size.width : size.height;

    const [systemReduceMotion, setSystemReduceMotion] = useState(false);
    useEffect(() => {
      let active = true;
      AccessibilityInfo.isReduceMotionEnabled()
        .then((value) => {
          // `false` is already the initial state, so only promote when reduced
          // motion is actually on - this also avoids a redundant async update.
          if (active && value) setSystemReduceMotion(true);
        })
        .catch(() => {});
      const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) =>
        setSystemReduceMotion(value),
      );
      return () => {
        active = false;
        sub?.remove?.();
      };
    }, []);

    const reduceMotion = reduceMotionProp ?? systemReduceMotion;
    const rtl = rtlProp ?? I18nManager.isRTL;

    const commitIndex = useCallback(
      (target: number) => {
        const clamped = clamp(target, 0, Math.max(0, count - 1));
        if (clamped === indexRef.current) return;
        indexRef.current = clamped;
        setIndex(clamped);
        onIndexChange?.(clamped);
      },
      [count, onIndexChange],
    );

    const goTo = useCallback(
      (target: number, animated = true) => {
        const clamped = clamp(target, 0, Math.max(0, count - 1));
        if (extent > 0) {
          const willAnimate = animated && !reduceMotion;
          const offset = clamped * extent;
          scrollRef.current?.scrollTo(
            axis === 'horizontal'
              ? { x: offset, animated: willAnimate }
              : { y: offset, animated: willAnimate },
          );
        }
        commitIndex(clamped);
      },
      [axis, count, extent, reduceMotion, commitIndex],
    );

    const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
    const previous = useCallback(() => goTo(indexRef.current - 1), [goTo]);
    const skip = useCallback(() => onSkip?.(), [onSkip]);
    const done = useCallback(() => onDone?.(), [onDone]);

    useImperativeHandle(
      ref,
      () => ({
        next,
        previous,
        goTo,
        get index() {
          return indexRef.current;
        },
      }),
      [next, previous, goTo],
    );

    const onScroll = useMemo(
      () =>
        Animated.event(
          [
            {
              nativeEvent: {
                contentOffset:
                  axis === 'horizontal'
                    ? { x: scrollPosition }
                    : { y: scrollPosition },
              },
            },
          ],
          { useNativeDriver: true },
        ),
      [axis, scrollPosition],
    );

    const onMomentumScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (extent <= 0) return;
        const offset =
          axis === 'horizontal'
            ? event.nativeEvent.contentOffset.x
            : event.nativeEvent.contentOffset.y;
        commitIndex(Math.round(offset / extent));
      },
      [axis, extent, commitIndex],
    );

    const onLayout = useCallback((event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    }, []);

    const didInit = useRef(false);
    useEffect(() => {
      if (didInit.current || extent <= 0) return;
      didInit.current = true;
      const target = clamp(initialIndex, 0, Math.max(0, count - 1));
      if (target > 0) {
        scrollRef.current?.scrollTo(
          axis === 'horizontal'
            ? { x: target * extent, animated: false }
            : { y: target * extent, animated: false },
        );
      }
    }, [axis, count, extent, initialIndex]);

    const renderLayer = (
      child: ReactNode,
      factor: number,
      align: LayerAlign,
      pageIndex: number,
    ): ReactNode => {
      if (child == null) return null;
      const transform = layerTransform(
        scrollPosition,
        pageIndex,
        reduceMotion ? 0 : factor,
        extent,
        axis,
        rtl,
      );
      const aligned = align === 'fill' ? null : alignToFlex(align);
      return (
        <Animated.View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            aligned,
            transform.length ? { transform } : null,
          ]}
        >
          {child}
        </Animated.View>
      );
    };

    const state: OnboardingRenderState = {
      index,
      count,
      isFirst: index <= 0,
      isLast: count > 0 && index >= count - 1,
      scrollPosition,
      pageExtent: extent,
      axis,
      rtl,
      tintColor,
      next,
      previous,
      goTo,
      skip,
      done,
    };

    const indicator = renderIndicator?.(state) ?? <Dots state={state} />;
    const controls =
      renderControls?.(state) ??
      DefaultControls({
        state,
        skipLabel,
        nextLabel,
        doneLabel,
        showSkip,
        indicator,
      });

    return (
      <View style={[styles.fill, style]} onLayout={onLayout}>
        {background != null && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {background}
          </View>
        )}
        <Animated.ScrollView
          ref={scrollRef}
          horizontal={axis === 'horizontal'}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          style={StyleSheet.absoluteFill}
        >
          {pages.map((page, i) => (
            <View
              key={i}
              style={[styles.page, { width: size.width, height: size.height }]}
            >
              {renderLayer(
                page.background,
                page.backgroundFactor ?? -0.2,
                page.backgroundAlign ?? 'fill',
                i,
              )}
              {renderLayer(
                page.content,
                page.contentFactor ?? 0,
                page.contentAlign ?? 'center',
                i,
              )}
              {renderLayer(
                page.foreground,
                page.foregroundFactor ?? 0.35,
                page.foregroundAlign ?? 'center',
                i,
              )}
            </View>
          ))}
        </Animated.ScrollView>
        <View style={styles.controlsContainer} pointerEvents="box-none">
          {controls}
        </View>
      </View>
    );
  },
);

interface DefaultControlsArgs {
  state: OnboardingRenderState;
  skipLabel: string;
  nextLabel: string;
  doneLabel: string;
  showSkip: boolean;
  indicator: ReactNode;
}

function DefaultControls({
  state,
  skipLabel,
  nextLabel,
  doneLabel,
  showSkip,
  indicator,
}: DefaultControlsArgs): ReactNode {
  const { isLast, count, pageExtent, scrollPosition, tintColor, next, skip, done } = state;

  const skipOpacity =
    count >= 2 && pageExtent > 0
      ? scrollPosition.interpolate({
          inputRange: [(count - 2) * pageExtent, (count - 1) * pageExtent],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        })
      : isLast
        ? 0
        : 1;

  return (
    <View style={styles.controlsRow}>
      <View style={[styles.side, styles.alignStart]}>
        {showSkip && (
          <Animated.View style={{ opacity: skipOpacity }}>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={isLast}
              onPress={skip}
            >
              <Text style={[styles.label, { color: tintColor }]}>{skipLabel}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
      {indicator}
      <View style={[styles.side, styles.alignEnd]}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={isLast ? done : next}
        >
          <Text style={[styles.label, { color: tintColor }]}>
            {isLast ? doneLabel : nextLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** How far the active dot stretches (8px base * 2.75 ~= 22px), via scaleX. */
const DOT_EXPANSION = 2.75;

function Dots({ state }: { state: OnboardingRenderState }): ReactNode {
  const { count, pageExtent, scrollPosition, tintColor } = state;
  const dots: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const animated = pageExtent > 0;
    const inputRange = [(i - 1) * pageExtent, i * pageExtent, (i + 1) * pageExtent];
    // `width` is a layout prop the native animated driver can't touch, and the
    // scroll position is native-driven, so stretch the dot with a horizontal
    // scale (a transform) instead - same look, fully native.
    const scaleX = animated
      ? scrollPosition.interpolate({
          inputRange,
          outputRange: [1, DOT_EXPANSION, 1],
          extrapolate: 'clamp',
        })
      : 1;
    const opacity = animated
      ? scrollPosition.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        })
      : 1;
    dots.push(
      <Animated.View
        key={i}
        style={[
          styles.dot,
          { opacity, backgroundColor: tintColor, transform: [{ scaleX }] },
        ]}
      />,
    );
  }
  return <View style={styles.dotsRow}>{dots}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  // Clip each page to its own bounds so a layer's parallax drift (or a
  // deliberately oversized background) can never bleed into the next page.
  page: { overflow: 'hidden' },
  controlsContainer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  side: { flex: 1, justifyContent: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  label: { fontSize: 16, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 6 },
});
