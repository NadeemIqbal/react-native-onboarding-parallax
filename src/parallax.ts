/** Scroll axis for paging and parallax motion. */
export type Axis = 'horizontal' | 'vertical';

/** Arguments to {@link parallaxTranslate}. */
export interface ParallaxTranslateOptions {
  /**
   * Signed distance, in pages, of the layer's page from the centre of the
   * viewport: `0` when centred, `-1` when one page ahead, `1` when one page
   * behind. Usually `scrollOffset / pageExtent - pageIndex`.
   */
  pageDelta: number;
  /**
   * How far the layer moves relative to the page. `0` pins it to the page (no
   * parallax). Larger magnitudes move it more; negative values move it the
   * opposite way, which reads as a deeper background.
   */
  factor: number;
  /** Main-axis size of the viewport in pixels. */
  extent: number;
  /** Axis the host scrolls along. Defaults to `'horizontal'`. */
  axis?: Axis;
  /**
   * Whether to mirror horizontal motion for right-to-left layouts. Vertical
   * motion ignores this. Defaults to `false`.
   */
  rtl?: boolean;
}

/** A translation, in pixels, to apply to a parallax layer. */
export interface ParallaxTranslation {
  translateX: number;
  translateY: number;
}

/**
 * Computes the parallax translation for a single depth layer.
 *
 * The magnitude is `pageDelta * factor * extent`, so a `factor` of `1` shifts
 * the layer by one full viewport per page of scroll. For a horizontal axis the
 * result is mirrored when `rtl` is true so the depth reads the same in both
 * directions; vertical layers ignore `rtl`.
 *
 * ```ts
 * parallaxTranslate({ pageDelta: -0.5, factor: 0.4, extent: 200 });
 * // => { translateX: -40, translateY: 0 }
 * ```
 */
export function parallaxTranslate({
  pageDelta,
  factor,
  extent,
  axis = 'horizontal',
  rtl = false,
}: ParallaxTranslateOptions): ParallaxTranslation {
  const magnitude = pageDelta * factor * extent;
  if (axis === 'vertical') {
    return { translateX: 0, translateY: magnitude };
  }
  const sign = rtl ? -1 : 1;
  return { translateX: magnitude * sign, translateY: 0 };
}
