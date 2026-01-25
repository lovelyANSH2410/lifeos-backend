import express from 'express';
import * as wishlistController from './wishlist.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', wishlistController.createWishlistItem);
router.get('/', wishlistController.getWishlistItems);
router.get('/:id', wishlistController.getWishlistItemById);
router.patch('/:id', wishlistController.updateWishlistItem);
router.delete('/:id', wishlistController.deleteWishlistItem);

export default router;
