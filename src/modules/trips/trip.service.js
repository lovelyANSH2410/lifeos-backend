import Trip from './trip.model.js';
import { uploadImage, deleteImage } from '../../utils/cloudinary.util.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Calculate trip status based on dates
 */
const calculateTripStatus = (startDate, endDate, currentStatus) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Don't recalculate if trip is cancelled
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

/**
 * Calculate days until trip starts
 */
const calculateDaysToGo = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Create a new trip
 */
export const createTrip = async (userId, tripData, coverImageFile = null) => {
  try {
    let coverImage = null;

    // Upload cover image to Cloudinary if provided
    if (coverImageFile) {
      try {
        const imageData = await uploadImage(coverImageFile, 'trip-covers');
        coverImage = {
          publicId: imageData.publicId,
          url: imageData.url
        };
      } catch (error) {
        logger.error(`Failed to upload trip cover image: ${error.message}`);
        // Continue without image if upload fails
      }
    }

    // Calculate initial status
    const status = calculateTripStatus(tripData.startDate, tripData.endDate, 'upcoming');

    // Create trip
    const trip = await Trip.create({
      userId,
      title: tripData.title,
      location: {
        city: tripData.city,
        country: tripData.country
      },
      startDate: new Date(tripData.startDate),
      endDate: new Date(tripData.endDate),
      coverImage,
      status,
      budget: tripData.budget ? {
        estimated: tripData.budget.estimated,
        currency: tripData.budget.currency || 'USD'
      } : undefined,
      notes: tripData.notes,
      isPinned: tripData.isPinned || false
    });

    return trip;
  } catch (error) {
    logger.error(`Create trip error: ${error.message}`);
    throw error;
  }
};

/**
 * Get trips for a user with filters
 */
export const getTrips = async (userId, filters = {}) => {
  try {
    const {
      status,
      limit = 20,
      page = 1
    } = filters;

    // Build query
    const query = {
      userId
    };

    // Handle status filter
    if (status) {
      if (status === 'past') {
        // Past trips are completed or cancelled
        query.status = { $in: ['completed', 'cancelled'] };
      } else {
        query.status = status;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    let sortOrder = {};
    if (status === 'upcoming' || !status) {
      sortOrder = { startDate: 1 }; // ASC for upcoming
    } else if (status === 'past') {
      sortOrder = { startDate: -1 }; // DESC for past
    } else {
      sortOrder = { startDate: -1 }; // Default DESC
    }

    // Fetch trips
    const trips = await Trip.find(query)
      .sort(sortOrder)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Recalculate status and add daysToGo for each trip
    const now = new Date();
    const enrichedTrips = trips.map(trip => {
      const currentStatus = calculateTripStatus(trip.startDate, trip.endDate, trip.status);
      
      // Update status in database if it changed (async, don't wait)
      if (currentStatus !== trip.status && trip.status !== 'cancelled') {
        Trip.findByIdAndUpdate(trip._id, { status: currentStatus }, { new: false })
          .catch(err => logger.error(`Failed to update trip status: ${err.message}`));
      }

      const enriched = {
        ...trip,
        status: currentStatus
      };

      // Add daysToGo for upcoming trips
      if (currentStatus === 'upcoming') {
        enriched.daysToGo = calculateDaysToGo(trip.startDate);
      }

      return enriched;
    });

    // Get total count for pagination
    const total = await Trip.countDocuments(query);

    return {
      trips: enrichedTrips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    logger.error(`Get trips error: ${error.message}`);
    throw error;
  }
};

/**
 * Get trip summary
 */
export const getTripSummary = async (userId) => {
  try {
    const now = new Date();

    // Get upcoming trips (status = upcoming or startDate > now)
    const upcomingCount = await Trip.countDocuments({
      userId,
      $or: [
        { status: 'upcoming' },
        { startDate: { $gt: now } }
      ],
      status: { $ne: 'cancelled' }
    });

    // Get completed trips
    const completedCount = await Trip.countDocuments({
      userId,
      status: 'completed'
    });

    // Get next trip (closest upcoming)
    const nextTrip = await Trip.findOne({
      userId,
      $or: [
        { status: 'upcoming' },
        { startDate: { $gt: now } }
      ],
      status: { $ne: 'cancelled' }
    })
      .sort({ startDate: 1 })
      .lean();

    let enrichedNextTrip = null;
    if (nextTrip) {
      const currentStatus = calculateTripStatus(nextTrip.startDate, nextTrip.endDate, nextTrip.status);
      enrichedNextTrip = {
        ...nextTrip,
        status: currentStatus,
        daysToGo: currentStatus === 'upcoming' ? calculateDaysToGo(nextTrip.startDate) : null
      };
    }

    return {
      upcomingCount,
      completedCount,
      nextTrip: enrichedNextTrip
    };
  } catch (error) {
    logger.error(`Get trip summary error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single trip by ID
 */
export const getTripById = async (tripId, userId) => {
  try {
    const trip = await Trip.findOne({
      _id: tripId,
      userId
    }).lean();

    if (!trip) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Recalculate status
    const currentStatus = calculateTripStatus(trip.startDate, trip.endDate, trip.status);
    
    // Update status in database if it changed
    if (currentStatus !== trip.status && trip.status !== 'cancelled') {
      await Trip.findByIdAndUpdate(tripId, { status: currentStatus });
    }

    const enriched = {
      ...trip,
      status: currentStatus
    };

    // Add daysToGo for upcoming trips
    if (currentStatus === 'upcoming') {
      enriched.daysToGo = calculateDaysToGo(trip.startDate);
    }

    return enriched;
  } catch (error) {
    logger.error(`Get trip by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a trip
 */
export const updateTrip = async (tripId, userId, updateData, coverImageFile = null) => {
  try {
    const trip = await Trip.findOne({
      _id: tripId,
      userId
    });

    if (!trip) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Handle cover image update
    if (coverImageFile) {
      // Delete old image if exists
      if (trip.coverImage && trip.coverImage.publicId) {
        try {
          await deleteImage(trip.coverImage.publicId);
        } catch (error) {
          logger.error(`Failed to delete old cover image: ${error.message}`);
          // Continue even if deletion fails
        }
      }

      // Upload new image
      try {
        const imageData = await uploadImage(coverImageFile, 'trip-covers');
        updateData.coverImage = {
          publicId: imageData.publicId,
          url: imageData.url
        };
      } catch (error) {
        logger.error(`Failed to upload new cover image: ${error.message}`);
        // Don't update image if upload fails
        delete updateData.coverImage;
      }
    }

    // Prepare update object
    const updateFields = {};

    if (updateData.title !== undefined) updateFields.title = updateData.title.trim();
    if (updateData.city !== undefined) {
      updateFields['location.city'] = updateData.city.trim();
    }
    if (updateData.country !== undefined) {
      updateFields['location.country'] = updateData.country.trim();
    }
    if (updateData.startDate !== undefined) {
      updateFields.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate !== undefined) {
      updateFields.endDate = new Date(updateData.endDate);
    }
    if (updateData.coverImage !== undefined) {
      updateFields.coverImage = updateData.coverImage;
    }
    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
    }
    if (updateData.budget !== undefined) {
      updateFields.budget = updateData.budget;
    }
    if (updateData.notes !== undefined) {
      updateFields.notes = updateData.notes?.trim();
    }
    if (updateData.isPinned !== undefined) {
      updateFields.isPinned = updateData.isPinned;
    }

    // Recalculate status if dates changed
    if (updateFields.startDate || updateFields.endDate) {
      const startDate = updateFields.startDate || trip.startDate;
      const endDate = updateFields.endDate || trip.endDate;
      const currentStatus = trip.status;
      updateFields.status = calculateTripStatus(startDate, endDate, currentStatus);
    }

    // Update trip
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedTrip;
  } catch (error) {
    logger.error(`Update trip error: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete (cancel) a trip
 */
export const cancelTrip = async (tripId, userId) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      {
        _id: tripId,
        userId
      },
      {
        status: 'cancelled'
      },
      {
        new: true
      }
    );

    if (!trip) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Delete cover image from Cloudinary if exists
    if (trip.coverImage && trip.coverImage.publicId) {
      try {
        await deleteImage(trip.coverImage.publicId);
      } catch (error) {
        logger.error(`Failed to delete cover image: ${error.message}`);
        // Continue even if deletion fails
      }
    }

    return trip;
  } catch (error) {
    logger.error(`Cancel trip error: ${error.message}`);
    throw error;
  }
};
