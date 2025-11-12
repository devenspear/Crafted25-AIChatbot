/**
 * Device & User Context Analytics
 * Analyzes device types, browsers, locations, and performance from analytics events
 */

import { getAnalyticsEvents } from './analytics-kv';

export interface DeviceMetrics {
  deviceTypes: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  screenSizes: Record<string, number>;
  touchVsDesktop: {
    touch: number;
    desktop: number;
  };
  pixelRatios: Record<string, number>;
}

export interface LocationMetrics {
  timezones: Record<string, number>;
  languages: Record<string, number>;
  topTimezones: Array<{ timezone: string; count: number; percentage: number }>;
  topLanguages: Array<{ language: string; count: number; percentage: number }>;
}

export interface PerformanceMetrics {
  avgPageLoadTime?: number;
  connectionTypes: Record<string, number>;
  effectiveTypes: Record<string, number>;
  avgDownlink?: number;
  avgRtt?: number;
  saveDataUsers: number;
  totalUsers: number;
}

export interface DeviceAnalytics {
  device: DeviceMetrics;
  location: LocationMetrics;
  performance: PerformanceMetrics;
  summary: {
    totalSessions: number;
    mobilePercentage: number;
    tabletPercentage: number;
    desktopPercentage: number;
    topDevice: string;
    topBrowser: string;
    topOS: string;
    topTimezone: string;
    topLanguage: string;
  };
}

/**
 * Get comprehensive device, location, and performance analytics
 */
export async function getDeviceAnalytics(days: number = 30): Promise<DeviceAnalytics> {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;

  // Get all events with device context
  const events = await getAnalyticsEvents(startTime, now);

  // Filter events that have device context
  const eventsWithDevice = events.filter(e => e.device || e.location || e.performance);

  // Initialize metrics
  const deviceTypes: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const operatingSystems: Record<string, number> = {};
  const screenSizes: Record<string, number> = {};
  const pixelRatios: Record<string, number> = {};
  const timezones: Record<string, number> = {};
  const languages: Record<string, number> = {};
  const connectionTypes: Record<string, number> = {};
  const effectiveTypes: Record<string, number> = {};

  let touchDevices = 0;
  let desktopDevices = 0;
  let totalPageLoadTime = 0;
  let pageLoadCount = 0;
  let totalDownlink = 0;
  let downlinkCount = 0;
  let totalRtt = 0;
  let rttCount = 0;
  let saveDataCount = 0;

  // Aggregate data
  for (const event of eventsWithDevice) {
    // Device info
    if (event.device) {
      const { type, browser, os, screenSize, touchEnabled, pixelRatio } = event.device;

      if (type) deviceTypes[type] = (deviceTypes[type] || 0) + 1;
      if (browser) browsers[browser] = (browsers[browser] || 0) + 1;
      if (os) operatingSystems[os] = (operatingSystems[os] || 0) + 1;
      if (screenSize) screenSizes[screenSize] = (screenSizes[screenSize] || 0) + 1;

      if (touchEnabled) touchDevices++;
      else desktopDevices++;

      if (pixelRatio) {
        const ratioKey = pixelRatio.toFixed(1);
        pixelRatios[ratioKey] = (pixelRatios[ratioKey] || 0) + 1;
      }
    }

    // Location info
    if (event.location) {
      const { timezone, language } = event.location;

      if (timezone && timezone !== 'unknown') {
        timezones[timezone] = (timezones[timezone] || 0) + 1;
      }
      if (language && language !== 'unknown') {
        languages[language] = (languages[language] || 0) + 1;
      }
    }

    // Performance info
    if (event.performance) {
      const { pageLoadTime, connectionType, effectiveType, downlink, rtt, saveData } = event.performance;

      if (pageLoadTime) {
        totalPageLoadTime += pageLoadTime;
        pageLoadCount++;
      }

      if (connectionType) {
        connectionTypes[connectionType] = (connectionTypes[connectionType] || 0) + 1;
      }

      if (effectiveType) {
        effectiveTypes[effectiveType] = (effectiveTypes[effectiveType] || 0) + 1;
      }

      if (downlink !== undefined) {
        totalDownlink += downlink;
        downlinkCount++;
      }

      if (rtt !== undefined) {
        totalRtt += rtt;
        rttCount++;
      }

      if (saveData) {
        saveDataCount++;
      }
    }
  }

  // Calculate percentages and rankings
  const totalSessions = eventsWithDevice.length;
  const mobileCount = deviceTypes.mobile || 0;
  const tabletCount = deviceTypes.tablet || 0;
  const desktopCount = deviceTypes.desktop || 0;

  const mobilePercentage = totalSessions > 0 ? (mobileCount / totalSessions) * 100 : 0;
  const tabletPercentage = totalSessions > 0 ? (tabletCount / totalSessions) * 100 : 0;
  const desktopPercentage = totalSessions > 0 ? (desktopCount / totalSessions) * 100 : 0;

  // Top items
  const topDevice = Object.entries(deviceTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topBrowser = Object.entries(browsers).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topOS = Object.entries(operatingSystems).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topTimezone = Object.entries(timezones).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  // Top timezones and languages with percentages
  const totalTimezones = Object.values(timezones).reduce((sum, count) => sum + count, 0);
  const topTimezones = Object.entries(timezones)
    .map(([timezone, count]) => ({
      timezone,
      count,
      percentage: totalTimezones > 0 ? (count / totalTimezones) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalLanguages = Object.values(languages).reduce((sum, count) => sum + count, 0);
  const topLanguages = Object.entries(languages)
    .map(([language, count]) => ({
      language,
      count,
      percentage: totalLanguages > 0 ? (count / totalLanguages) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    device: {
      deviceTypes,
      browsers,
      operatingSystems,
      screenSizes,
      touchVsDesktop: {
        touch: touchDevices,
        desktop: desktopDevices,
      },
      pixelRatios,
    },
    location: {
      timezones,
      languages,
      topTimezones,
      topLanguages,
    },
    performance: {
      avgPageLoadTime: pageLoadCount > 0 ? totalPageLoadTime / pageLoadCount : undefined,
      connectionTypes,
      effectiveTypes,
      avgDownlink: downlinkCount > 0 ? totalDownlink / downlinkCount : undefined,
      avgRtt: rttCount > 0 ? totalRtt / rttCount : undefined,
      saveDataUsers: saveDataCount,
      totalUsers: totalSessions,
    },
    summary: {
      totalSessions,
      mobilePercentage: Number(mobilePercentage.toFixed(1)),
      tabletPercentage: Number(tabletPercentage.toFixed(1)),
      desktopPercentage: Number(desktopPercentage.toFixed(1)),
      topDevice,
      topBrowser,
      topOS,
      topTimezone,
      topLanguage,
    },
  };
}
