import type { ReactNode } from 'react';
import type { FlexStyle } from 'react-native';

/**
 * Where a layer sits inside its page. `'fill'` stretches the layer to cover the
 * whole page (the default for backgrounds); the rest pin the layer to an edge
 * or corner at its natural size.
 */
export type LayerAlign =
  | 'fill'
  | 'center'
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'centerLeft'
  | 'centerRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight';

/**
 * One screen of a {@link ParallaxOnboarding} flow, built from up to three depth
 * slots that move independently as the user pages.
 *
 * The slots are painted back to front - `background`, then `content`, then
 * `foreground` - and each has its own parallax factor so they drift at
 * different speeds. A slot left undefined is simply skipped, so a page can use
 * as few or as many layers as it needs.
 *
 * ```tsx
 * const page: OnboardingPage = {
 *   background: <View style={{ flex: 1, backgroundColor: '#101820' }} />,
 *   content: <Text style={{ fontSize: 32 }}>Welcome</Text>,
 *   foreground: <Logo />,
 *   foregroundFactor: 0.5,
 * };
 * ```
 */
export interface OnboardingPage {
  /**
   * Deepest, slowest slot. Painted first, so it sits furthest back. With the
   * default `'fill'` alignment it covers the page, which suits full-bleed
   * colours, gradients and images.
   */
  background?: ReactNode;
  /** Main slot for text and imagery. Painted above `background`. */
  content?: ReactNode;
  /** Nearest, fastest slot. Painted last, so it sits closest to the viewer. */
  foreground?: ReactNode;
  /**
   * Parallax factor for `background`. Defaults to `-0.2` so it drifts opposite
   * the swipe, reading as distance.
   */
  backgroundFactor?: number;
  /** Parallax factor for `content`. Defaults to `0`, pinning it to the page. */
  contentFactor?: number;
  /**
   * Parallax factor for `foreground`. Defaults to `0.35` so it leads the swipe,
   * reading as nearness.
   */
  foregroundFactor?: number;
  /** Alignment for `background`. Defaults to `'fill'`. */
  backgroundAlign?: LayerAlign;
  /** Alignment for `content`. Defaults to `'center'`. */
  contentAlign?: LayerAlign;
  /** Alignment for `foreground`. Defaults to `'center'`. */
  foregroundAlign?: LayerAlign;
}

/** Resolves a {@link LayerAlign} to the flexbox style that positions a layer. */
export function alignToFlex(align: LayerAlign): Pick<
  FlexStyle,
  'justifyContent' | 'alignItems'
> {
  switch (align) {
    case 'fill':
    case 'center':
      return { justifyContent: 'center', alignItems: 'center' };
    case 'topLeft':
      return { justifyContent: 'flex-start', alignItems: 'flex-start' };
    case 'topCenter':
      return { justifyContent: 'flex-start', alignItems: 'center' };
    case 'topRight':
      return { justifyContent: 'flex-start', alignItems: 'flex-end' };
    case 'centerLeft':
      return { justifyContent: 'center', alignItems: 'flex-start' };
    case 'centerRight':
      return { justifyContent: 'center', alignItems: 'flex-end' };
    case 'bottomLeft':
      return { justifyContent: 'flex-end', alignItems: 'flex-start' };
    case 'bottomCenter':
      return { justifyContent: 'flex-end', alignItems: 'center' };
    case 'bottomRight':
      return { justifyContent: 'flex-end', alignItems: 'flex-end' };
  }
}
