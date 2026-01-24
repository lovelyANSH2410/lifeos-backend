import VaultItem from './vault.model.js';
import { encrypt, decrypt } from '../../utils/vaultCrypto.util.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Create a new vault item
 */
export const createVaultItem = async (userId, itemData) => {
  try {
    // Encrypt password before saving
    const encryptedPassword = encrypt(itemData.password);

    // Create vault item
    const vaultItem = await VaultItem.create({
      userId,
      title: itemData.title.trim(),
      username: itemData.username?.trim(),
      encryptedPassword,
      category: itemData.category || 'credentials',
      notes: itemData.notes?.trim()
    });

    // Return item without encrypted password
    const itemObj = vaultItem.toObject();
    delete itemObj.encryptedPassword;

    return itemObj;
  } catch (error) {
    logger.error(`Create vault item error: ${error.message}`);
    throw error;
  }
};

/**
 * Get vault items for a user
 */
export const getVaultItems = async (userId, filters = {}) => {
  try {
    const { category } = filters;

    // Build query
    const query = {
      userId
    };

    if (category) {
      query.category = category;
    }

    // Fetch vault items (without encrypted password)
    const vaultItems = await VaultItem.find(query)
      .select('-encryptedPassword')
      .sort({ createdAt: -1 })
      .lean();

    return vaultItems;
  } catch (error) {
    logger.error(`Get vault items error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single vault item by ID (without password)
 */
export const getVaultItemById = async (itemId, userId) => {
  try {
    const vaultItem = await VaultItem.findOne({
      _id: itemId,
      userId
    })
      .select('-encryptedPassword')
      .lean();

    if (!vaultItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return vaultItem;
  } catch (error) {
    logger.error(`Get vault item by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Reveal (decrypt) password for a vault item
 */
export const revealPassword = async (itemId, userId) => {
  try {
    const vaultItem = await VaultItem.findOne({
      _id: itemId,
      userId
    });

    if (!vaultItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Decrypt password in memory
    const plaintextPassword = decrypt(vaultItem.encryptedPassword);

    // Return only the password (never log it)
    return {
      password: plaintextPassword
    };
  } catch (error) {
    logger.error(`Reveal password error: ${error.message}`);
    
    // Don't expose decryption errors in detail
    if (error.message.includes('decrypt')) {
      throw new Error('Failed to decrypt password');
    }
    
    throw error;
  }
};

/**
 * Update a vault item
 */
export const updateVaultItem = async (itemId, userId, updateData) => {
  try {
    const vaultItem = await VaultItem.findOne({
      _id: itemId,
      userId
    });

    if (!vaultItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Prepare update object
    const updateFields = {};

    if (updateData.title !== undefined) {
      updateFields.title = updateData.title.trim();
    }
    if (updateData.username !== undefined) {
      updateFields.username = updateData.username?.trim() || null;
    }
    if (updateData.notes !== undefined) {
      updateFields.notes = updateData.notes?.trim() || null;
    }
    if (updateData.category !== undefined) {
      updateFields.category = updateData.category;
    }

    // If password is provided, re-encrypt it
    if (updateData.password !== undefined) {
      updateFields.encryptedPassword = encrypt(updateData.password);
    }

    // Update vault item
    const updatedItem = await VaultItem.findByIdAndUpdate(
      itemId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).select('-encryptedPassword');

    return updatedItem;
  } catch (error) {
    logger.error(`Update vault item error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a vault item
 */
export const deleteVaultItem = async (itemId, userId) => {
  try {
    const vaultItem = await VaultItem.findOneAndDelete({
      _id: itemId,
      userId
    });

    if (!vaultItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Return success (don't return deleted item)
    return { success: true };
  } catch (error) {
    logger.error(`Delete vault item error: ${error.message}`);
    throw error;
  }
};
