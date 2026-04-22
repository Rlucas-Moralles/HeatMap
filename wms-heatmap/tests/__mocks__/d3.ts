export function scaleLinear() {
  let domainValues: number[] = [];
  let rangeValues: string[] = [];
  let interpolateFunc = defaultInterpolate;

  function scale(value: number): string {
    if (domainValues.length === 0) return rangeValues[0];
    
    // Find position in domain
    let position = 0;
    if (domainValues.length > 1) {
      const min = domainValues[0];
      const max = domainValues[domainValues.length - 1];
      if (max !== min) {
        position = (value - min) / (max - min);
      }
    }
    position = Math.max(0, Math.min(1, position));
    
    // Interpolate between range values
    return interpolateFunc(rangeValues[0], rangeValues[1], position);
  }

  scale.domain = function(values: number[]) {
    domainValues = values;
    return scale;
  };

  scale.range = function(values: string[]) {
    rangeValues = values;
    return scale;
  };

  scale.interpolate = function(func: any) {
    interpolateFunc = func;
    return scale;
  };

  return scale;
}

function defaultInterpolate(a: string, b: string, t: number): string {
  return interpolateRgb(a, b, t);
}

export function interpolateRgb(a: string, b: string, t: number): string {
  const aRgb = hexToRgb(a);
  const bRgb = hexToRgb(b);
  
  const r = Math.round(aRgb[0] + (bRgb[0] - aRgb[0]) * t);
  const g = Math.round(aRgb[1] + (bRgb[1] - aRgb[1]) * t);
  const bl = Math.round(aRgb[2] + (bRgb[2] - aRgb[2]) * t);
  
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
}

export const d3 = {
  scaleLinear,
  interpolateRgb
};

export default {
  scaleLinear,
  interpolateRgb
};
