# File Upload Limits & Security

This document outlines all file upload limits and security measures implemented in LifeOS backend.

## Global Limits

### Express Body Parser
- **JSON**: 10MB limit
- **URL Encoded**: 10MB limit
- **Location**: `app.js`

### Rate Limiting

#### General Upload Rate Limiter
- **Window**: 15 minutes
- **Max Requests**: 30 uploads per IP per window
- **Applied to**: All image upload endpoints (diary, trips, watch, gifting, ideas, profile)
- **Middleware**: `uploadRateLimiter` from `uploadLimit.middleware.js`

#### Strict Upload Rate Limiter (Large Files)
- **Window**: 1 hour
- **Max Requests**: 10 uploads per IP per window
- **Applied to**: Document uploads (vault documents)
- **Middleware**: `strictUploadRateLimiter` from `uploadLimit.middleware.js`

#### Vault Documents Additional Limiter
- **Window**: 15 minutes
- **Max Requests**: 20 uploads per IP per window
- **Applied to**: Vault document uploads only

## Per-Endpoint Limits

### Diary Entries (`/api/diary`)
- **File Size**: 5MB per file
- **File Count**: Maximum 5 images per entry
- **File Types**: Images only (JPEG, PNG, WEBP, GIF)
- **Rate Limit**: 30 uploads per 15 minutes

### Travel Plans (`/api/trips`)
- **File Size**: 5MB per file
- **File Count**: 1 cover image per trip
- **File Types**: Images only
- **Rate Limit**: 30 uploads per 15 minutes

### Watch Items (`/api/watch`)
- **File Size**: 5MB per file
- **File Count**: 1 poster per item
- **File Types**: Images only
- **Rate Limit**: 30 uploads per 15 minutes

### Gifting & Dates (`/api/gifting`)
- **File Size**: 5MB per file
- **File Count**: Maximum 3 images per item
- **File Types**: Images only
- **Rate Limit**: 30 uploads per 15 minutes

### Idea Inbox (`/api/ideas`)
- **File Size**: 5MB per file
- **File Count**: 1 image per idea
- **File Types**: Images only
- **Rate Limit**: 30 uploads per 15 minutes

### Profile Image (`/api/auth/profile`)
- **File Size**: 5MB per file
- **File Count**: 1 image per user
- **File Types**: Images only
- **Rate Limit**: 30 uploads per 15 minutes

### Vault Documents (`/api/vault/documents`)
- **File Size**: 10MB per file
- **File Count**: 1 document per upload
- **File Types**: PDF, JPEG, JPG, PNG, WEBP
- **Rate Limit**: 
  - 10 uploads per hour (strict limiter)
  - 20 uploads per 15 minutes (additional limiter)

## Cloudinary Limits

### Free Tier Constraints
- **Max File Size**: 10MB per file
- **Storage**: 25GB total
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month

### Validation
- All files are validated before upload to Cloudinary
- Files exceeding 10MB are rejected with clear error message
- Automatic quality optimization enabled for images

## Security Measures

### File Type Validation
- **Images**: Only `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`
- **Documents**: Only `application/pdf`
- **Videos**: Explicitly blocked (all video MIME types rejected)

### File Filtering
- All upload endpoints use `multer` with `fileFilter` middleware
- Invalid file types are rejected before processing
- Error messages are user-friendly

### Memory Storage
- All files are stored in memory (not disk) during processing
- Files are immediately uploaded to Cloudinary
- No temporary files remain on server

## Error Handling

### Multer Errors
- `LIMIT_FILE_SIZE`: Returns 400 with message "File size too large. Maximum size is XMB"
- `LIMIT_FILE_COUNT`: Returns 400 with message "Too many files. Maximum is X files"
- `LIMIT_UNEXPECTED_FILE`: Returns 400 with generic file upload error

### Rate Limit Errors
- Returns 429 (Too Many Requests) with appropriate message
- Standard rate limit headers included in response

## Future Enhancements

### Per-User Limits (TODO)
- Daily upload count tracking per user
- Monthly storage quota per user
- Subscription-based limits (FREE vs PRO vs COUPLE)
- Redis-based tracking for better performance

### Additional Security (TODO)
- Virus scanning for uploaded files
- Image metadata validation
- Content-based file type detection (not just MIME type)
- Automatic image compression before upload

## Configuration

All limits can be adjusted in:
- `middlewares/uploadLimit.middleware.js` - Rate limiting configuration
- Individual route files - Multer configuration
- `app.js` - Express body parser limits
- `utils/cloudinary.util.js` - Cloudinary upload settings

## Monitoring

Consider implementing:
- Upload metrics tracking
- Storage usage per user
- Rate limit violation alerts
- Cloudinary usage monitoring
