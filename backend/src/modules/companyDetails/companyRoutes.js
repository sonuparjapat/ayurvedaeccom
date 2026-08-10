const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./company.controller');
const { admin } = require('../../middlewares/admin');

const upload = multer({ storage: multer.memoryStorage() });

// Public reads
router.get('/config', controller.getPublicConfig);
router.get('/', controller.getCompanies);
router.get('/:id', controller.getCompanyById);

// Admin-only writes
router.post('/', admin, upload.single('logo'), controller.createCompany);
router.put('/:id', admin, upload.single('logo'), controller.updateCompany);
router.delete('/:id', admin, controller.deleteCompany);

module.exports = router;