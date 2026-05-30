# Changelog

## 0.1.0

Initial release.

- `ParallaxOnboarding`: batteries-included, swipeable onboarding carousel with
  layered parallax pages, an animated dot indicator, and skip / next / done
  controls, driven on the native animated driver.
- `OnboardingPage`: a page model with `background` / `content` / `foreground`
  depth slots, each with its own parallax factor and alignment.
- `OnboardingController`: imperative `ref` handle exposing `next`, `previous`,
  `goTo`, and the current `index`.
- `OnboardingRenderState`: state passed to `renderIndicator` / `renderControls`
  so custom chrome can animate against the live scroll position.
- `ParallaxLayer`: a static primitive that translates its child by
  `pageDelta * factor * extent` along either axis.
- `parallaxTranslate`: the pure, React-free function behind the layer math, with
  `axis` and `rtl` support.
- First-class RTL (mirrors horizontal motion under `I18nManager.isRTL`) and
  reduced-motion support (reads the platform setting, overridable via
  `reduceMotion`).
- Pure TypeScript with no native modules to link.
