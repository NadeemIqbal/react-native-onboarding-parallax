import { parallaxTranslate } from '../parallax';

describe('parallaxTranslate', () => {
  test('a zero factor produces no movement', () => {
    expect(parallaxTranslate({ pageDelta: 1, factor: 0, extent: 400 })).toEqual({
      translateX: 0,
      translateY: 0,
    });
  });

  test('horizontal translation is pageDelta * factor * extent', () => {
    expect(
      parallaxTranslate({ pageDelta: -0.5, factor: 0.4, extent: 200 }),
    ).toEqual({ translateX: -40, translateY: 0 });
  });

  test('right-to-left mirrors horizontal motion', () => {
    const ltr = parallaxTranslate({ pageDelta: -0.5, factor: 0.4, extent: 200 });
    const rtl = parallaxTranslate({
      pageDelta: -0.5,
      factor: 0.4,
      extent: 200,
      rtl: true,
    });
    expect(rtl.translateX).toBe(-ltr.translateX);
    expect(rtl.translateY).toBe(0);
  });

  test('vertical motion uses the y axis and ignores rtl', () => {
    const offset = parallaxTranslate({
      pageDelta: 0.25,
      factor: 0.6,
      extent: 800,
      axis: 'vertical',
      rtl: true,
    });
    expect(offset).toEqual({ translateX: 0, translateY: 120 });
  });
});
