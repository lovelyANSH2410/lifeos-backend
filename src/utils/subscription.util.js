/**
 * Feature gating utility
 * Check if user can access a specific feature based on their subscription
 * 
 * @param {Object} user - User document with subscription field
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} - Whether user can access the feature
 */
export const canAccessFeature = (user, featureName) => {
  if (!user || !user.subscription) {
    return false;
  }

  const { plan } = user.subscription;
  const isActive = user.isSubscriptionActive ? user.isSubscriptionActive() : true;

  // If subscription is not active, only allow FREE features
  if (!isActive && plan !== 'FREE') {
    return canAccessFeature({ subscription: { plan: 'FREE' } }, featureName);
  }

  // Feature definitions
  const features = {
    // FREE plan features
    diary: {
      FREE: { limit: 10 }, // Limited entries
      PRO: { limit: -1 }, // Unlimited
      COUPLE: { limit: -1 }, // Unlimited
      LIFETIME: { limit: -1 } // Unlimited
    },
    ideas: {
      FREE: { limit: 20 }, // Limited ideas
      PRO: { limit: -1 }, // Unlimited
      COUPLE: { limit: -1 }, // Unlimited
      LIFETIME: { limit: -1 } // Unlimited
    },
    vault: {
      FREE: false, // No access
      PRO: true,
      COUPLE: true,
      LIFETIME: true
    },
    documents: {
      FREE: false, // No access
      PRO: true,
      COUPLE: true,
      LIFETIME: true
    },
    travel: {
      FREE: { limit: 5 }, // Limited trips
      PRO: { limit: -1 }, // Unlimited
      COUPLE: { limit: -1 }, // Unlimited
      LIFETIME: { limit: -1 } // Unlimited
    },
    watch: {
      FREE: { limit: 50 }, // Limited items
      PRO: { limit: -1 }, // Unlimited
      COUPLE: { limit: -1 }, // Unlimited
      LIFETIME: { limit: -1 } // Unlimited
    },
    gifting: {
      FREE: { limit: 20 }, // Limited items
      PRO: { limit: -1 }, // Unlimited
      COUPLE: { limit: -1 }, // Unlimited
      LIFETIME: { limit: -1 } // Unlimited
    },
    subscriptions: {
      FREE: { limit: 5 }, // Limited subscriptions
      PRO: { limit: -1 }, // Unlimited
      COUPLE: { limit: -1 }, // Unlimited
      LIFETIME: { limit: -1 } // Unlimited
    },
    money: {
      FREE: true, // Full access
      PRO: true,
      COUPLE: true,
      LIFETIME: true
    },
    sharedFeatures: {
      FREE: false, // No shared features
      PRO: false,
      COUPLE: true, // COUPLE plan has shared features
      LIFETIME: true
    }
  };

  const feature = features[featureName];
  if (!feature) {
    // Unknown feature - default to allowing access
    return true;
  }

  const access = feature[plan];
  if (access === undefined) {
    return false;
  }

  // If access is boolean, return it directly
  if (typeof access === 'boolean') {
    return access;
  }

  // If access is an object with limit, return true (limit checking should be done separately)
  if (typeof access === 'object' && access.limit !== undefined) {
    return true;
  }

  return false;
};

/**
 * Get feature limit for a user
 * 
 * @param {Object} user - User document with subscription field
 * @param {string} featureName - Name of the feature
 * @returns {number} - Limit (-1 for unlimited, 0 for no access, >0 for specific limit)
 */
export const getFeatureLimit = (user, featureName) => {
  if (!user || !user.subscription) {
    return 0;
  }

  const { plan } = user.subscription;
  const isActive = user.isSubscriptionActive ? user.isSubscriptionActive() : true;

  // If subscription is not active, return FREE limits
  if (!isActive && plan !== 'FREE') {
    return getFeatureLimit({ subscription: { plan: 'FREE' } }, featureName);
  }

  const features = {
    diary: {
      FREE: 10,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    },
    ideas: {
      FREE: 20,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    },
    vault: {
      FREE: 0,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    },
    documents: {
      FREE: 0,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    },
    travel: {
      FREE: 5,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    },
    watch: {
      FREE: 50,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    },
    gifting: {
      FREE: 20,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    },
    subscriptions: {
      FREE: 5,
      PRO: -1,
      COUPLE: -1,
      LIFETIME: -1
    }
  };

  const feature = features[featureName];
  if (!feature) {
    return -1; // Unknown feature - unlimited
  }

  const limit = feature[plan];
  return limit !== undefined ? limit : 0;
};
