import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { ParallaxLayer } from '../ParallaxLayer';

type Transform = { translateX: number; translateY: number };

function layerTransform(renderer: TestRenderer.ReactTestRenderer): Transform {
  const view = renderer.root.find((node) => (node.type as unknown) === 'View');
  const styles = ([] as unknown[]).concat(view.props.style as unknown);
  const withTransform = styles.find(
    (s): s is { transform: Array<Record<string, number>> } =>
      !!s && typeof s === 'object' && 'transform' in s,
  );
  const transform = withTransform!.transform;
  return Object.assign({}, ...transform) as Transform;
}

describe('ParallaxLayer', () => {
  test('translates its child by pageDelta * factor * extent', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ParallaxLayer pageDelta={-0.5} factor={0.4} extent={200}>
          <Text>hi</Text>
        </ParallaxLayer>,
      );
    });
    expect(layerTransform(renderer)).toEqual({ translateX: -40, translateY: 0 });
  });

  test('mirrors horizontal motion in RTL', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ParallaxLayer pageDelta={-0.5} factor={0.4} extent={200} rtl>
          <Text>hi</Text>
        </ParallaxLayer>,
      );
    });
    expect(layerTransform(renderer)).toEqual({ translateX: 40, translateY: 0 });
  });

  test('moves along the y axis when vertical', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ParallaxLayer pageDelta={0.25} factor={0.6} extent={800} axis="vertical">
          <Text>hi</Text>
        </ParallaxLayer>,
      );
    });
    expect(layerTransform(renderer)).toEqual({ translateX: 0, translateY: 120 });
  });
});
