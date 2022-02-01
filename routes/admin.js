const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { upload, uploadMultiple } = require("../middlewares/multer");
const auth = require("../middlewares/auth");

router.get("/signin", adminController.viewSignIn);
router.post("/signin", adminController.actionSignIn);

// below is auth route or private route
router.use(auth);
router.get("/signout", adminController.actionSignOut);
// endpoint dashboard
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
// endpoint feature
router.post("/item/add/feature", upload, adminController.addFeature);
router.put("/item/update/feature", upload, adminController.updateFeature);
router.delete("/item/:itemId/feature/:id", adminController.deleteFeature);
// endpoint activity
router.post("/item/add/activity", upload, adminController.addActivity);
router.put("/item/update/activity", upload, adminController.updateActivity);
router.delete("/item/:itemId/activity/:id", adminController.deleteActivity);

// endpoint booking
router.get("/booking", adminController.viewBooking);
router.get("/booking/:id", adminController.showDetailBooking);
router.put("/booking/:id/confirm", adminController.actionConfirm);
router.put("/booking/:id/reject", adminController.actionReject);

module.exports = router;
