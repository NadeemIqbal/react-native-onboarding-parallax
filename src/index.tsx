/**
 * react-native-onboarding-parallax
 *
 * A parallax onboarding carousel for React Native with per-layer depth,
 * slot-based pages, and first-class RTL and reduced-motion support.
 */
export {
  parallaxTranslate,
  type Axis,
  type ParallaxTranslateOptions,
  type ParallaxTranslation,
} from './parallax';
export {
  alignToFlex,
  type LayerAlign,
  type OnboardingPage,
} from './OnboardingPage';
export { ParallaxLayer, type ParallaxLayerProps } from './ParallaxLayer';
export {
  ParallaxOnboarding,
  type OnboardingController,
  type OnboardingRenderState,
  type ParallaxOnboardingProps,
} from './ParallaxOnboarding';
