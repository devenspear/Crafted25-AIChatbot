/**
 * Privacy-Friendly User Tracking
 * Uses localStorage (not cookies) - no consent banner required
 * Anonymous IDs only - no personal data collected
 */

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
  browserVersion: string;
  screenSize: string;
  viewportSize: string;
  touchEnabled: boolean;
  pixelRatio: number;
}

export interface LocationInfo {
  timezone: string;
  timezoneOffset: number;
  language: string;
  languages: string[];
}

export interface PerformanceInfo {
  pageLoadTime?: number;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface UserProfile {
  userId: string;
  firstSeen: number;
  lastSeen: number;
  sessionCount: number;
  messageCount: number;
  isReturning: boolean;
  device?: DeviceInfo;
  location?: LocationInfo;
  performance?: PerformanceInfo;
}

const USER_ID_KEY = 'crafted_user_id';
const USER_PROFILE_KEY = 'crafted_user_profile';

/**
 * Detect device type based on screen width and user agent
 */
function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile';
  }
  if (width <= 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

/**
 * Parse user agent to extract browser and OS info
 */
function parseUserAgent(): { browser: string; browserVersion: string; os: string } {
  if (typeof window === 'undefined') {
    return { browser: 'unknown', browserVersion: 'unknown', os: 'unknown' };
  }

  const ua = navigator.userAgent;
  let browser = 'unknown';
  let browserVersion = 'unknown';
  let os = 'unknown';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  // Detect Browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'unknown';
  }

  return { browser, browserVersion, os };
}

/**
 * Collect device information
 */
function collectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'unknown',
      os: 'unknown',
      browser: 'unknown',
      browserVersion: 'unknown',
      screenSize: 'unknown',
      viewportSize: 'unknown',
      touchEnabled: false,
      pixelRatio: 1,
    };
  }

  const { browser, browserVersion, os } = parseUserAgent();

  return {
    type: detectDeviceType(),
    os,
    browser,
    browserVersion,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    touchEnabled: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Collect location information (timezone and language)
 */
function collectLocationInfo(): LocationInfo {
  if (typeof window === 'undefined') {
    return {
      timezone: 'unknown',
      timezoneOffset: 0,
      language: 'unknown',
      languages: [],
    };
  }

  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    timezoneOffset: new Date().getTimezoneOffset(),
    language: navigator.language || 'unknown',
    languages: navigator.languages ? Array.from(navigator.languages) : [],
  };
}

/**
 * Collect performance and network information
 */
function collectPerformanceInfo(): PerformanceInfo {
  if (typeof window === 'undefined') return {};

  const perfInfo: PerformanceInfo = {};

  // Page load time
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    if (timing.loadEventEnd && timing.navigationStart) {
      perfInfo.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    }
  }

  // Network information (Chrome/Edge only)
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    perfInfo.connectionType = connection.type || 'unknown';
    perfInfo.effectiveType = connection.effectiveType || 'unknown';
    perfInfo.downlink = connection.downlink;
    perfInfo.rtt = connection.rtt;
    perfInfo.saveData = connection.saveData || false;
  }

  return perfInfo;
}

/**
 * Generate a unique anonymous user ID
 */
function generateUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `user_${timestamp}_${random}`;
}

/**
 * Get or create user ID
 * Called on app initialization
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return '';

  try {
    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
      userId = generateUserId();
      localStorage.setItem(USER_ID_KEY, userId);

      // Collect enhanced data
      const deviceInfo = collectDeviceInfo();
      const locationInfo = collectLocationInfo();
      const performanceInfo = collectPerformanceInfo();

      // Initialize user profile with enhanced data
      const profile: UserProfile = {
        userId,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        sessionCount: 1,
        messageCount: 0,
        isReturning: false,
        device: deviceInfo,
        location: locationInfo,
        performance: performanceInfo,
      };

      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

      console.log('[User Tracking] New user created:', userId);
      console.log('[User Tracking] Device:', deviceInfo.type, deviceInfo.os, deviceInfo.browser);
      console.log('[User Tracking] Location:', locationInfo.timezone, locationInfo.language);
    } else {
      // Update existing user profile
      updateUserProfile();
      console.log('[User Tracking] Returning user:', userId);
    }

    return userId;
  } catch (error) {
    console.error('[User Tracking] Error getting user ID:', error);
    return `user_fallback_${Date.now()}`;
  }
}

/**
 * Get user profile
 */
export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const profileStr = localStorage.getItem(USER_PROFILE_KEY);
    if (!profileStr) return null;

    return JSON.parse(profileStr) as UserProfile;
  } catch (error) {
    console.error('[User Tracking] Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile on each visit
 */
function updateUserProfile(): void {
  try {
    const profile = getUserProfile();
    if (!profile) return;

    const now = Date.now();
    const hoursSinceLastSeen = (now - profile.lastSeen) / (1000 * 60 * 60);

    // Consider as new session if more than 30 minutes since last activity
    const isNewSession = hoursSinceLastSeen > 0.5;

    // Update performance info for returning users
    const performanceInfo = collectPerformanceInfo();

    // Ensure device and location exist for legacy profiles
    const deviceInfo = profile.device || collectDeviceInfo();
    const locationInfo = profile.location || collectLocationInfo();

    const updatedProfile: UserProfile = {
      ...profile,
      lastSeen: now,
      sessionCount: isNewSession ? profile.sessionCount + 1 : profile.sessionCount,
      isReturning: true, // They came back!
      device: deviceInfo,
      location: locationInfo,
      performance: performanceInfo,
    };

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
  } catch (error) {
    console.error('[User Tracking] Error updating user profile:', error);
  }
}

/**
 * Increment message count for user
 */
export function incrementUserMessageCount(): void {
  if (typeof window === 'undefined') return;

  try {
    const profile = getUserProfile();
    if (!profile) return;

    profile.messageCount += 1;
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('[User Tracking] Error incrementing message count:', error);
  }
}

/**
 * Check if user is new (first visit)
 */
export function isNewUser(): boolean {
  const profile = getUserProfile();
  return profile ? !profile.isReturning : true;
}

/**
 * Check if user is returning
 */
export function isReturningUser(): boolean {
  const profile = getUserProfile();
  return profile ? profile.isReturning : false;
}

/**
 * Get user engagement level
 */
export function getUserEngagementLevel(): 'new' | 'casual' | 'active' | 'power' {
  const profile = getUserProfile();
  if (!profile) return 'new';

  if (profile.sessionCount === 1) return 'new';
  if (profile.messageCount < 5) return 'casual';
  if (profile.messageCount < 20) return 'active';
  return 'power';
}

/**
 * Get days since first visit
 */
export function getDaysSinceFirstVisit(): number {
  const profile = getUserProfile();
  if (!profile) return 0;

  const daysSince = (Date.now() - profile.firstSeen) / (1000 * 60 * 60 * 24);
  return Math.floor(daysSince);
}

/**
 * Clear user data (for privacy - allows user to opt out)
 */
export function clearUserData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    console.log('[User Tracking] User data cleared');
  } catch (error) {
    console.error('[User Tracking] Error clearing user data:', error);
  }
}
