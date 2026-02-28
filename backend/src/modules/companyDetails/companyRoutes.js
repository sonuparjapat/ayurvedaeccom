const express = require('express');
const router = express.Router();
const controller = require('./company.controller');

router.post('/', controller.createCompany);
router.get('/', controller.getCompanies);
router.get('/:id', controller.getCompanyById);
router.put('/:id', controller.updateCompany);
router.delete('/:id', controller.deleteCompany);

module.exports = router;