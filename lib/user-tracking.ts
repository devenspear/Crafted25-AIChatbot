/**
 * Privacy-Friendly User Tracking
 * Uses localStorage (not cookies) - no consent banner required
 * Anonymous IDs only - no personal data collected
 */

export interface UserProfile {
  userId: string;
  firstSeen: number;
  lastSeen: number;
  sessionCount: number;
  messageCount: number;
  isReturning: boolean;
}

const USER_ID_KEY = 'crafted_user_id';
const USER_PROFILE_KEY = 'crafted_user_profile';

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

      // Initialize user profile
      const profile: UserProfile = {
        userId,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        sessionCount: 1,
        messageCount: 0,
        isReturning: false,
      };

      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

      console.log('[User Tracking] New user created:', userId);
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

    const updatedProfile: UserProfile = {
      ...profile,
      lastSeen: now,
      sessionCount: isNewSession ? profile.sessionCount + 1 : profile.sessionCount,
      isReturning: true, // They came back!
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
