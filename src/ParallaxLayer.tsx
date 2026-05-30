import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { parallaxTranslate, type Axis } from './parallax';

/** Props for {@link ParallaxLayer}. */
export interface ParallaxLayerProps {
  children: ReactNode;
  /**
   * Signed distance of this layer's page from the viewport centre, in pages.
   * Usually `scrollOffset / pageExtent - pageIndex`.
   */
  pageDelta: number;
  /**
   * How far the layer moves relative to the page. `0` pins it to the page (no
   * parallax). Negative values move it the opposite way, reading as a deeper
   * background. Defaults to `0`.
   */
  factor?: number;
  /** Main-axis size of the viewport in pixels. Defaults to `0`. */
  extent?: number;
  /** Axis the host scrolls along. Defaults to `'horizontal'`. */
  axis?: Axis;
  /** Mirror horizontal motion for right-to-left layouts. Defaults to `false`. */
  rtl?: boolean;
  /** Style applied to the wrapping view, before the parallax transform. */
  style?: StyleProp<ViewStyle>;
}

/**
 * A single depth layer that drifts as the surrounding page scrolls.
 *
 * `ParallaxLayer` is the low-level primitive behind {@link ParallaxOnboarding}.
 * It is a pure presentational view: given how far its page is from rest
 * (`pageDelta`) it translates its children by `pageDelta * factor * extent`
 * along `axis`, using {@link parallaxTranslate}. Drop it into your own pager,
 * tracking the scroll position in state, to build a custom layered layout
 * without adopting the rest of the package.
 *
 * ```tsx
 * <ParallaxLayer pageDelta={page - index} factor={0.4} extent={width}>
 *   <Logo />
 * </ParallaxLayer>
 * ```
 */
export function ParallaxLayer({
  children,
  pageDelta,
  factor = 0,
  extent = 0,
  axis = 'horizontal',
  rtl = false,
  style,
}: ParallaxLayerProps) {
  const { translateX, translateY } = parallaxTranslate({
    pageDelta,
    factor,
    extent,
    axis,
    rtl,
  });
  return (
    <View style={[style, { transform: [{ translateX }, { translateY }] }]}>
      {children}
    </View>
  );
}
