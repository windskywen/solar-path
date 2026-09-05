export interface AdSenseSettings {
  enabled: boolean;
  clientId: string;
  sidebarSlotId: string;
  toolSlotId: string;
  articleSlotId: string;
}

export const ADSENSE_ELIGIBLE_PATHS = [
  '/',
  '/sunrise-sunset-calculator',
  '/golden-hour-calculator',
  '/solar-azimuth-altitude',
  '/guides/how-to-read-a-sun-path-diagram',
  '/guides/brisbane-winter-vs-summer-sun-path',
  '/guides/east-vs-west-facing-homes-australia',
  '/guides/golden-hour-direction-brisbane',
  '/guides/solar-azimuth-altitude-worked-example',
  '/guides/estimating-shadow-direction-from-solar-angles',
] as const;

export function isAdSenseEligiblePath(pathname: string): boolean {
  return (ADSENSE_ELIGIBLE_PATHS as readonly string[]).includes(pathname);
}

export function getAdSenseSettings(): AdSenseSettings {
  return {
    enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
    clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ?? '',
    sidebarSlotId: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID?.trim() ?? '',
    toolSlotId: process.env.NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID?.trim() ?? '',
    articleSlotId: process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID?.trim() ?? '',
  };
}

export function hasAdSenseScriptConfig(
  settings: AdSenseSettings = getAdSenseSettings()
): boolean {
  return settings.enabled && settings.clientId.length > 0;
}

export function hasSidebarAdSlotConfig(
  settings: AdSenseSettings = getAdSenseSettings()
): boolean {
  return hasAdSenseScriptConfig(settings) && settings.sidebarSlotId.length > 0;
}

export function hasToolAdSlotConfig(
  settings: AdSenseSettings = getAdSenseSettings()
): boolean {
  return hasAdSenseScriptConfig(settings) && settings.toolSlotId.length > 0;
}

export function hasArticleAdSlotConfig(
  settings: AdSenseSettings = getAdSenseSettings()
): boolean {
  return hasAdSenseScriptConfig(settings) && settings.articleSlotId.length > 0;
}
