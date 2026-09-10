import { UAParser } from 'ua-parser-js';

export function getApproximateScreenWidth(
  userAgent?: string | null,
  defaultWidth = 1280
) {
  if (!userAgent) {
    return defaultWidth;
  }

  try {
    const parser = new UAParser(userAgent);
    const deviceType = parser.getDevice().type;
    return deviceType === 'mobile' || deviceType === 'tablet' ? 800 : 1300;
  } catch (error) {
    return defaultWidth;
  }
}
