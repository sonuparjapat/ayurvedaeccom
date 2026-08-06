const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./company.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/config', controller.getPublicConfig);
router.post('/', upload.single('logo'), controller.createCompany);
router.get('/', controller.getCompanies);
router.get('/:id', controller.getCompanyById);
router.put('/:id', upload.single('logo'), controller.updateCompany);
router.delete('/:id', controller.deleteCompany);

module.exports = router;