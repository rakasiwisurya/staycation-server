const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { upload, uploadMultiple } = require("../middlewares/multer");

router.get("/dashboard", adminController.viewDashboard);

// endpoint category
router.get("/category", adminController.viewCategory);
router.post("/category", adminController.addCategory);
router.put("/category", adminController.updateCategory);
router.delete("/category/:id", adminController.deleteCatergory);

// endpoint bank
router.get("/bank", adminController.viewBank);
router.post("/bank", upload, adminController.addBank);
router.put("/bank", upload, adminController.updateBank);
router.delete("/bank/:id", adminController.deleteBank);

// endpoint item
router.get("/item", adminController.viewItem);
router.post("/item", uploadMultiple, adminController.addItem);
router.get("/item/show-image/:id", adminController.showImageItem);
router.get("/item/:id", adminController.showEditItem);
router.put("/item/:id", uploadMultiple, adminController.updateItem);
router.delete("/item/:id", adminController.deleteItem);

// endpoint detail item
router.get("/item/show-detail-item/:itemId", adminController.viewDetailItem);
router.post("/item/add/feature", upload, adminController.addFeature);
router.put("/item/update/feature", upload, adminController.updateFeature);
router.delete("/item/:itemId/feature/:id", adminController.deleteFeature);

router.get("/booking", adminController.viewBooking);

module.exports = router;
