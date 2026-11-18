const SupplierModel = require('../models/supplierModel');

const VALID_PROVINCES = [
  'Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape',
  'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
];

const SupplierController = {
  async createSupplier(req, res, next) {
    try {
      const { business_name, contact_person, phone, province, address } = req.body;
      if (!business_name || !contact_person || !phone || !province || !address) {
        return res.status(400).json({ success: false, message: 'All supplier fields are required.' });
      }
      if (!VALID_PROVINCES.includes(province)) {
        return res.status(400).json({ success: false, message: `Invalid province. Must be one of: ${VALID_PROVINCES.join(', ')}` });
      }
      const supplier = await SupplierModel.create({ business_name, contact_person, phone, province, address });
      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  },

  async getAllSuppliers(req, res, next) {
    try {
      const suppliers = await SupplierModel.findAll();
      res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
    } catch (error) {
      next(error);
    }
  },

  async getSupplierById(req, res, next) {
    try {
      const supplier = await SupplierModel.findById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found.' });
      }
      res.status(200).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  },

  async updateSupplier(req, res, next) {
    try {
      const { business_name, contact_person, phone, province, address } = req.body;
      if (!business_name || !contact_person || !phone || !province || !address) {
        return res.status(400).json({ success: false, message: 'All supplier fields are required.' });
      }
      if (!VALID_PROVINCES.includes(province)) {
        return res.status(400).json({ success: false, message: 'Invalid South African province.' });
      }
      const affected = await SupplierModel.update(req.params.id, { business_name, contact_person, phone, province, address });
      if (!affected) {
        return res.status(404).json({ success: false, message: 'Supplier not found.' });
      }
      res.status(200).json({ success: true, message: 'Supplier updated successfully.' });
    } catch (error) {
      next(error);
    }
  },

  async deleteSupplier(req, res, next) {
    try {
      const supplier = await SupplierModel.findById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found.' });
      }
      const linked = await SupplierModel.hasPurchases(req.params.id);
      if (linked) {
        return res.status(400).json({
          success: false,
          message: 'Business constraint violation: Cannot delete a supplier with existing purchase records.'
        });
      }
      await SupplierModel.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Supplier deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = SupplierController;
