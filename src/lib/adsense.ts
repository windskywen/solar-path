export interface AdSenseSettings {
  enabled: boolean;
  clientId: string;
  sidebarSlotId: string;
  toolSlotId: string;
  articleSlotId: string;
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
