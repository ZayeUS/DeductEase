import express from 'express';
import { query } from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import {logAudit} from '../utils/auditLogger.js';
import { uploadAvatar } from '../middlewares/multer.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// CREATE a new profile for the authenticated user
router.post('/', authenticate, async (req, res) => {
  const { user_id } = req.user;
  const { 
    first_name, 
    last_name, 
    date_of_birth,
    business_type,
    agency_type,
    tax_year_start 
  } = req.body;

  if (!first_name || !last_name || !date_of_birth) {
    return res.status(400).json({ message: "First name, last name and date of birth are required." });
  }

  const queryText = `
    INSERT INTO profiles (user_id, first_name, last_name, date_of_birth, business_type, agency_type, tax_year_start)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
  const values = [
    user_id, 
    first_name, 
    last_name, 
    date_of_birth,
    business_type || null,
    agency_type || null,
    tax_year_start || '2024-01-01'
  ];

  try {
    const result = await query(queryText, values);
    await logAudit({
      actorUserId: user_id,
      targetUserId: user_id,
      action: 'create_profile',
      tableName: 'profiles',
      recordId: result.rows[0].profile_id,
      metadata: { 
        first_name, 
        last_name, 
        date_of_birth,
        business_type,
        agency_type,
        tax_year_start 
      }
    });
    res.status(201).json({ message: "Profile created successfully", profile: result.rows[0] });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Error creating profile" });
  }
});

// Upload avatar for the authenticated user
router.post('/avatar', authenticate, uploadAvatar, async (req, res) => {
  const { user_id } = req.user;

  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }

  try {
    // 1. Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.path);

    // 2. Ensure profile exists before updating
    const checkProfileQuery = 'SELECT * FROM profiles WHERE user_id = $1';
    const profileCheckResult = await query(checkProfileQuery, [user_id]);

    if (profileCheckResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // 3. Update profile with avatar URL
    const updateQuery = `
      UPDATE profiles
      SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *`;
    const values = [uploadResult.secure_url, user_id];

    const result = await query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // 4. Audit
    await logAudit({
      actorUserId: user_id,
      targetUserId: user_id,
      action: 'upload_avatar',
      tableName: 'profiles',
      recordId: result.rows[0].profile_id,
      metadata: { avatar_url: uploadResult.secure_url }
    });

    res.status(200).json({ message: 'Avatar uploaded successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// READ the authenticated user's profile
router.get('/', authenticate, async (req, res) => {
  const { user_id } = req.user;
  const queryText = 'SELECT * FROM profiles WHERE user_id = $1';
  const values = [user_id];

  try {
    const result = await query(queryText, values);
    if (result.rows.length === 0) {
      return res.status(200).json(null);  // Send null instead of {}
    }
    res.status(200).json(result.rows[0]);  // Return the profile if found
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// UPDATE the authenticated user's profile
router.put('/', authenticate, async (req, res) => {
  const { user_id } = req.user;
  const { 
    first_name, 
    last_name, 
    date_of_birth,
    business_type,
    agency_type,
    tax_year_start 
  } = req.body;

  if (!first_name || !last_name || !date_of_birth) {
    return res.status(400).json({ message: "First name, last name and date of birth are required." });
  }

  const queryText = `
    UPDATE profiles
    SET first_name = $1, 
        last_name = $2, 
        date_of_birth = $3,
        business_type = $4,
        agency_type = $5,
        tax_year_start = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $7 RETURNING *`;
  const values = [
    first_name, 
    last_name, 
    date_of_birth,
    business_type,
    agency_type,
    tax_year_start,
    user_id
  ];

  try {
    const result = await query(queryText, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    await logAudit({
      actorUserId: user_id,
      targetUserId: user_id,
      action: 'update_profile',
      tableName: 'profiles',
      recordId: result.rows[0].profile_id,
      metadata: { 
        first_name, 
        last_name, 
        date_of_birth,
        business_type,
        agency_type,
        tax_year_start 
      }
    });
    res.status(200).json({ message: 'Profile updated', profile: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// DELETE the authenticated user's profile
router.delete('/', authenticate, async (req, res) => {
  const { user_id } = req.user;
  const queryText = 'DELETE FROM profiles WHERE user_id = $1 RETURNING *';
  const values = [user_id];

  try {
    const result = await query(queryText, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    await logAudit({
      actorUserId: user_id,
      targetUserId: user_id,
      action: 'delete_profile',
      tableName: 'profiles',
      recordId: result.rows[0].profile_id
    });
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ message: 'Error deleting profile' });
  }
});

export default router;