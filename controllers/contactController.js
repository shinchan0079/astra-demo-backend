import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/contacts.json');

// Helper to read contacts from JSON file
const readContacts = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading contacts file:', error);
    return [];
  }
};

// Helper to write contacts to JSON file
const writeContacts = (contacts) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing contacts file:', error);
    return false;
  }
};

/**
 * POST /api/login
 * Admin authentication endpoint
 */
export const adminLogin = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/username and password.'
      });
    }

    // Read credentials from .env or use defaults
    const configuredEmail = (process.env.ADMIN_EMAIL || 'admin@theworkplace.com').trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (
      (email.trim().toLowerCase() === configuredEmail || email.trim().toLowerCase() === 'admin') &&
      password === configuredPassword
    ) {
      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token: 'twp-jwt-' + Buffer.from(email + ':' + Date.now()).toString('base64'),
        user: {
          id: 'adm-01',
          name: 'System Administrator',
          email: configuredEmail,
          role: 'Super Admin'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please use admin@theworkplace.com and admin123'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * GET /api/contacts
 * Retrieve all contact inquiries (supports ?status=... & ?search=...)
 */
export const getContacts = (req, res) => {
  try {
    let contacts = readContacts();
    const { status, search } = req.query;

    if (status && status !== 'All') {
      contacts = contacts.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const term = search.toLowerCase();
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.subject.toLowerCase().includes(term) ||
        (c.message && c.message.toLowerCase().includes(term))
      );
    }

    // Sort newest first
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving contacts' });
  }
};

/**
 * GET /api/contacts/:id
 * Retrieve a single contact message by ID
 */
export const getContactById = (req, res) => {
  try {
    const contacts = readContacts();
    const contact = contacts.find(c => c.id === req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact inquiry not found' });
    }

    return res.status(200).json({ success: true, data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving contact' });
  }
};

/**
 * POST /api/contacts
 * Create a new contact inquiry (submitted from Contact page or Admin)
 */
export const createContact = (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, subject, and message.'
      });
    }

    const contacts = readContacts();
    const newContact = {
      id: 'cw-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: req.body.status || 'Pending',
      notes: req.body.notes || 'New inquiry from website contact form.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contacts.unshift(newContact);
    writeContacts(contacts);

    return res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! We will get back to you shortly.',
      data: newContact
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error creating contact' });
  }
};

/**
 * PUT /api/contacts/:id
 * Update an existing contact inquiry (e.g. status, admin notes, details)
 */
export const updateContact = (req, res) => {
  try {
    const contacts = readContacts();
    const index = contacts.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Contact inquiry not found' });
    }

    const existing = contacts[index];
    const { name, email, subject, message, status, notes } = req.body;

    contacts[index] = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      email: email !== undefined ? email.trim() : existing.email,
      subject: subject !== undefined ? subject.trim() : existing.subject,
      message: message !== undefined ? message.trim() : existing.message,
      status: status !== undefined ? status : existing.status,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: new Date().toISOString()
    };

    writeContacts(contacts);

    return res.status(200).json({
      success: true,
      message: 'Contact inquiry updated successfully.',
      data: contacts[index]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating contact' });
  }
};

/**
 * DELETE /api/contacts/:id
 * Remove a contact inquiry
 */
export const deleteContact = (req, res) => {
  try {
    const contacts = readContacts();
    const filtered = contacts.filter(c => c.id !== req.params.id);

    if (filtered.length === contacts.length) {
      return res.status(404).json({ success: false, message: 'Contact inquiry not found' });
    }

    writeContacts(filtered);

    return res.status(200).json({
      success: true,
      message: 'Contact inquiry deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting contact' });
  }
};

/**
 * GET /api/stats
 * Overview analytics for Admin Dashboard
 */
export const getStats = (req, res) => {
  try {
    const contacts = readContacts();
    const total = contacts.length;
    const pending = contacts.filter(c => c.status === 'Pending').length;
    const inProgress = contacts.filter(c => c.status === 'In Progress').length;
    const resolved = contacts.filter(c => c.status === 'Resolved').length;

    return res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        resolved,
        recent: contacts.slice(0, 5)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving statistics' });
  }
};

/**
 * POST /api/reset
 * Reset contacts to default seed demo data
 */
export const resetSeed = (req, res) => {
  try {
    const initialSeed = [
      {
        id: "cw-1001",
        name: "Arjun Patel",
        email: "arjun.patel@techinnovations.io",
        subject: "Private Office for Team of 6",
        message: "Hi, we are looking for a dedicated private office space for our 6-person engineering team starting next month. Would love to schedule a visit this Thursday.",
        status: "Pending",
        notes: "Followed up via automated email. Awaiting team size confirmation.",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "cw-1002",
        name: "Sarah Miller",
        email: "sarah.miller@designstudio.com",
        subject: "Dedicated Desk Inquiry",
        message: "Hello! I am a freelance UI/UX designer looking for a quiet dedicated desk with 24/7 access and monitor setup support. What are the flexible billing terms?",
        status: "In Progress",
        notes: "Sent pricing catalog and 1-day free pass code.",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "cw-1003",
        name: "Michael Chang",
        email: "mchang@consultingpartners.org",
        subject: "Conference Room Booking for Client Pitch",
        message: "We need the main conference room with 4K projector and video conferencing capabilities for a client meeting on Dec 2nd from 2 PM to 6 PM.",
        status: "Resolved",
        notes: "Booking confirmed for Room B. Payment received.",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: "cw-1004",
        name: "Pooja Verma",
        email: "pooja.v@fintechsphere.in",
        subject: "Virtual Office & Mail Delivery Service",
        message: "Greetings, does the virtual office plan include a registered commercial business address for GST registration, and do you scan urgent mail on the same day?",
        status: "Pending",
        notes: "Needs clarification regarding GST documentation.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    writeContacts(initialSeed);
    return res.status(200).json({ success: true, message: 'Demo data reset successfully', data: initialSeed });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error resetting seed' });
  }
};
