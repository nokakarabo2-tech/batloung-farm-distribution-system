const VendorModel = require('../models/vendorModel');

const VendorController = {
  async createVendor(req, res, next) {
    try {
      const { vendor_name, phone_number, location, registration_date } = req.body;
      if (!vendor_name || !phone_number || !location) {
        return res.status(400).json({ success: false, message: 'Vendor name, phone number, and location are required.' });
      }
      const vendor = await VendorModel.create({ vendor_name, phone_number, location, registration_date });
      res.status(201).json({ success: true, data: vendor });
    } catch (error) {
      next(error);
    }
  },

  async getAllVendors(req, res, next) {
    try {
      const vendors = await VendorModel.findAll();
      res.status(200).json({ success: true, count: vendors.length, data: vendors });
    } catch (error) {
      next(error);
    }
  },

  async searchVendors(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ success: false, message: 'Provide a search query parameter ?q=name_or_phone' });
      }
      const vendors = await VendorModel.search(q);
      res.status(200).json({ success: true, count: vendors.length, data: vendors });
    } catch (error) {
      next(error);
    }
  },

  async updateVendor(req, res, next) {
    try {
      const { vendor_name, phone_number, location } = req.body;
      if (!vendor_name || !phone_number || !location) {
        return res.status(400).json({ success: false, message: 'Vendor name, phone number, and location are required.' });
      }
      const affected = await VendorModel.update(req.params.id, { vendor_name, phone_number, location });
      if (!affected) {
        return res.status(404).json({ success: false, message: 'Vendor not found.' });
      }
      res.status(200).json({ success: true, message: 'Vendor updated successfully.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = VendorController;
