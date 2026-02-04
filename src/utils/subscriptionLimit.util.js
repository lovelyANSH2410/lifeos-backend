import User from '../modules/auth/auth.schema.js';
import DiaryEntry from '../modules/diary/diary.model.js';
import Idea from '../modules/ideas/idea.model.js';
import Trip from '../modules/trips/trip.model.js';
import WatchItem from '../modules/watch/watch.model.js';
import GiftIdea from '../modules/gifting/gifting.model.js';
import Subscription from '../modules/subscriptions/subscription.model.js';
import VaultItem from '../modules/vault/vault.model.js';
import VaultDocument from '../modules/vaultDocuments/vaultDocument.model.js';
import { getFeatureLimit } from './subscription.util.js';
import logger from './logger.util.js';

/**
 * Feature to model mapping
 */
const FEATURE_MODEL_MAP = {
  diary: {
    model: DiaryEntry,
    query: { isArchived: { $ne: true } } // Exclude archived entries
  },
  ideas: {
    model: Idea,
    query: { status: { $ne: 'archived' } } // Exclude archived ideas
  },
  travel: {
    model: Trip,
    query: {} // Count all trips
  },
  watch: {
    model: WatchItem,
    query: {} // Count all watch items
  },
  gifting: {
    model: GiftIdea,
    query: { status: { $ne: 'archived' } } // Exclude archived gift ideas
  },
  subscriptions: {
    model: Subscription,
    query: { status: { $in: ['active', 'paused'] } } // Count only active/paused subscriptions
  },
  vault: {
    model: VaultItem,
    query: {} // Count all vault items
  },
  documents: {
    model: VaultDocument,
    query: { isArchived: { $ne: true } } // Exclude archived documents
  }
};

/**
 * Feature display names
 */
const FEATURE_DISPLAY_NAMES = {
  diary: 'Diary Entries',
  ideas: 'Ideas',
  travel: 'Travel Plans',
  watch: 'Watch Items',
  gifting: 'Gift Ideas',
  subscriptions: 'Subscriptions',
  vault: 'Vault Credentials',
  documents: 'Vault Documents'
};

/**
 * Get count of user's items for a specific feature
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name (diary, ideas, travel, etc.)
 * @returns {Promise<number>} Count of items
 */
export const getUserItemCount = async (userId, featureName) => {
  try {
    const featureConfig = FEATURE_MODEL_MAP[featureName];
    
    if (!featureConfig) {
      logger.warn(`Unknown feature name: ${featureName}`);
      return 0;
    }

    const { model, query } = featureConfig;
    
    // Build query with userId and feature-specific filters
    const countQuery = {
      userId,
      ...query
    };

    const count = await model.countDocuments(countQuery);
    return count;
  } catch (error) {
    logger.error(`Get user item count error for ${featureName}: ${error.message}`);
    throw error;
  }
};

/**
 * Check if user can create more items for a feature
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name
 * @returns {Promise<Object>} { allowed: boolean, currentCount: number, limit: number, message: string }
 */
export const checkSubscriptionLimit = async (userId, featureName) => {
  try {
    // Get user with subscription
    const user = await User.findById(userId).select('subscription');
    
    if (!user) {
      return {
        allowed: false,
        currentCount: 0,
        limit: 0,
        message: 'User not found'
      };
    }

    // Get feature limit
    const limit = getFeatureLimit(user, featureName);

    // If limit is 0, feature is blocked (e.g., vault, documents for FREE)
    if (limit === 0) {
      const displayName = FEATURE_DISPLAY_NAMES[featureName] || featureName;
      return {
        allowed: false,
        currentCount: 0,
        limit: 0,
        message: `${displayName} is only available in PRO/COUPLE/LIFETIME plans. Upgrade to unlock this feature.`
      };
    }

    // If limit is -1, unlimited access
    if (limit === -1) {
      return {
        allowed: true,
        currentCount: 0,
        limit: -1,
        message: 'Unlimited access'
      };
    }

    // Get current count
    const currentCount = await getUserItemCount(userId, featureName);

    // Check if limit is reached
    const allowed = currentCount < limit;
    const displayName = FEATURE_DISPLAY_NAMES[featureName] || featureName;

    if (!allowed) {
      return {
        allowed: false,
        currentCount,
        limit,
        message: `You've reached your limit of ${limit} ${displayName.toLowerCase()}. Upgrade to PRO/COUPLE/LIFETIME for unlimited access.`
      };
    }

    return {
      allowed: true,
      currentCount,
      limit,
      message: `You can create ${limit - currentCount} more ${displayName.toLowerCase()}`
    };
  } catch (error) {
    logger.error(`Check subscription limit error for ${featureName}: ${error.message}`);
    throw error;
  }
};

/**
 * Get feature display name
 * @param {string} featureName - Feature name
 * @returns {string} Display name
 */
export const getFeatureDisplayName = (featureName) => {
  return FEATURE_DISPLAY_NAMES[featureName] || featureName;
};
