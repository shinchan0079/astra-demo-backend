import express from 'express';
import {
  adminLogin,
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getStats,
  resetSeed
} from '../controllers/contactController.js';

const router = express.Router();

// Authentication endpoint
router.post('/login', adminLogin);

// Statistics endpoint for dashboard
router.get('/stats', getStats);

// Reset demo data
router.post('/reset', resetSeed);

// CRUD Routes for Contacts
router.route('/contacts')
  .get(getContacts)       // Read all (with search & filter)
  .post(createContact);   // Create new contact

router.route('/contacts/:id')
  .get(getContactById)    // Read single contact
  .put(updateContact)     // Update contact (status, notes, etc.)
  .delete(deleteContact); // Delete contact

export default router;
