const bcrypt = require("bcryptjs");
const Category = require("../models/Category");
const Bank = require("../models/Bank");
const Item = require("../models/Item");
const Image = require("../models/Image");
const Feature = require("../models/Feature");
const Activity = require("../models/Activity");
const Users = require("../models/Users");
const Booking = require("../models/Booking");
const Member = require("../models/Member");
const { fileUrl, removeImage } = require("../helpers/storage");

/** Stores a flash message + status, then redirects. */
const flashRedirect = (req, res, status, message, redirect) => {
  req.flash("alertMessage", message);
  req.flash("alertStatus", status);
  res.redirect(redirect);
};

/** Reads and clears the current flash alert for rendering. */
const readAlert = (req) => ({
  message: req.flash("alertMessage"),
  status: req.flash("alertStatus"),
});

module.exports = {
  viewSignIn: (req, res) => {
    if (req.session.user) return res.redirect("/admin/dashboard");
    res.render("index", { alert: readAlert(req), title: "Staycation | Login" });
  },

  actionSignIn: async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await Users.findOne({ username });
      if (!user) {
        return flashRedirect(req, res, "danger", "User doesn't exist!", "/admin/signin");
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return flashRedirect(req, res, "danger", "Password is incorrect!", "/admin/signin");
      }

      req.session.user = { id: user.id, username: user.username };
      res.redirect("/admin/dashboard");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/signin");
    }
  },

  actionSignOut: (req, res) => {
    req.session.destroy(() => res.redirect("/admin/signin"));
  },

  viewDashboard: async (req, res) => {
    try {
      const [member, booking, item] = await Promise.all([
        Member.find(),
        Booking.find(),
        Item.find(),
      ]);

      res.render("admin/dashboard/view_dashboard", {
        title: "Staycation | Dashboard",
        member,
        booking,
        item,
        user: req.session.user,
      });
    } catch (error) {
      res.redirect("/admin/dashboard");
    }
  },

  viewCategory: async (req, res) => {
    try {
      const category = await Category.find();
      res.render("admin/category/view_category", {
        category,
        alert: readAlert(req),
        title: "Staycation | Category",
        user: req.session.user,
      });
    } catch (error) {
      res.redirect("/admin/category");
    }
  },

  addCategory: async (req, res) => {
    try {
      await Category.create(req.body);
      flashRedirect(req, res, "success", "Success Add Category", "/admin/category");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/category");
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id, name } = req.body;
      await Category.findByIdAndUpdate(id, { name });
      flashRedirect(req, res, "success", "Success Update Category", "/admin/category");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/category");
    }
  },

  deleteCatergory: async (req, res) => {
    try {
      await Category.deleteOne({ _id: req.params.id });
      flashRedirect(req, res, "success", "Success Delete Category", "/admin/category");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/category");
    }
  },

  viewBank: async (req, res) => {
    try {
      const bank = await Bank.find();
      res.render("admin/bank/view_bank", {
        title: "Staycation | Bank",
        bank,
        alert: readAlert(req),
        user: req.session.user,
      });
    } catch (error) {
      res.redirect("/admin/bank");
    }
  },

  addBank: async (req, res) => {
    try {
      const { nameBank, nomorRekening, name } = req.body;
      await Bank.create({
        nameBank,
        nomorRekening,
        name,
        imageUrl: fileUrl(req.file),
      });
      flashRedirect(req, res, "success", "Success Add Bank", "/admin/bank");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/bank");
    }
  },

  updateBank: async (req, res) => {
    try {
      const { id, nameBank, nomorRekening, name } = req.body;
      const bank = await Bank.findById(id);

      if (req.file) {
        await removeImage(bank.imageUrl);
        bank.imageUrl = fileUrl(req.file);
      }
      bank.nameBank = nameBank;
      bank.nomorRekening = nomorRekening;
      bank.name = name;
      await bank.save();

      flashRedirect(req, res, "success", "Success Update Bank", "/admin/bank");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/bank");
    }
  },

  deleteBank: async (req, res) => {
    try {
      const bank = await Bank.findById(req.params.id);
      await removeImage(bank.imageUrl);
      await bank.deleteOne();
      flashRedirect(req, res, "success", "Success Delete Bank", "/admin/bank");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/bank");
    }
  },

  viewItem: async (req, res) => {
    try {
      const item = await Item.find()
        .populate({ path: "imageId", select: "id imageUrl" })
        .populate({ path: "categoryId", select: "id name" });
      const category = await Category.find();

      res.render("admin/item/view_item", {
        title: "Staycation | Item",
        category,
        alert: readAlert(req),
        item,
        action: "view",
        user: req.session.user,
      });
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/item");
    }
  },

  addItem: async (req, res) => {
    try {
      const { title, price, city, categoryId, about } = req.body;
      if (!req.files || req.files.length === 0) {
        return flashRedirect(req, res, "danger", "Please upload at least one image", "/admin/item");
      }

      const category = await Category.findById(categoryId);
      const item = await Item.create({
        categoryId: category._id,
        title,
        price,
        city,
        description: about,
      });

      category.itemId.push(item._id);
      await category.save();

      const images = await Image.insertMany(
        req.files.map((file) => ({ imageUrl: fileUrl(file) }))
      );
      item.imageId.push(...images.map((image) => image._id));
      await item.save();

      flashRedirect(req, res, "success", "Success Add Item", "/admin/item");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/item");
    }
  },

  showImageItem: async (req, res) => {
    try {
      const item = await Item.findById(req.params.id).populate({
        path: "imageId",
        select: "id imageUrl",
      });

      res.render("admin/item/view_item", {
        title: "Staycation | Show Image Item",
        alert: readAlert(req),
        item,
        action: "show image",
        user: req.session.user,
      });
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/item");
    }
  },

  showEditItem: async (req, res) => {
    try {
      const item = await Item.findById(req.params.id)
        .populate({ path: "imageId", select: "id imageUrl" })
        .populate({ path: "categoryId", select: "id name" });
      const category = await Category.find();

      res.render("admin/item/view_item", {
        title: "Staycation | Edit Item",
        alert: readAlert(req),
        item,
        category,
        action: "edit",
        user: req.session.user,
      });
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/item");
    }
  },

  updateItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, price, city, categoryId, about } = req.body;

      const item = await Item.findById(id).populate({
        path: "imageId",
        select: "id imageUrl",
      });

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < item.imageId.length; i++) {
          const image = await Image.findById(item.imageId[i]._id);
          if (req.files[i]) {
            await removeImage(image.imageUrl);
            image.imageUrl = fileUrl(req.files[i]);
            await image.save();
          }
        }
      }

      item.title = title;
      item.price = price;
      item.city = city;
      item.categoryId = categoryId;
      item.description = about;
      await item.save();

      flashRedirect(req, res, "success", "Success Update Item", "/admin/item");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/item");
    }
  },

  deleteItem: async (req, res) => {
    try {
      const item = await Item.findById(req.params.id).populate("imageId");

      for (const image of item.imageId) {
        await removeImage(image.imageUrl);
        await Image.deleteOne({ _id: image._id });
      }
      await item.deleteOne();

      flashRedirect(req, res, "success", "Success Delete Item", "/admin/item");
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, "/admin/item");
    }
  },

  viewDetailItem: async (req, res) => {
    const { itemId } = req.params;
    try {
      const [feature, activity] = await Promise.all([
        Feature.find({ itemId }),
        Activity.find({ itemId }),
      ]);

      res.render("admin/item/detail_item/view_detail_item", {
        title: "Staycation | Detail Item",
        alert: readAlert(req),
        itemId,
        feature,
        activity,
        user: req.session.user,
      });
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, `/admin/item/show-detail-item/${itemId}`);
    }
  },

  addFeature: async (req, res) => {
    const { name, qty, itemId } = req.body;
    const redirect = `/admin/item/show-detail-item/${itemId}`;
    try {
      if (!req.file) {
        return flashRedirect(req, res, "danger", "Image Not Found", redirect);
      }

      const feature = await Feature.create({
        name,
        qty,
        itemId,
        imageUrl: fileUrl(req.file),
      });

      await Item.findByIdAndUpdate(itemId, { $push: { featureId: feature._id } });
      flashRedirect(req, res, "success", "Success Add Feature", redirect);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, redirect);
    }
  },

  updateFeature: async (req, res) => {
    const { id, name, qty, itemId } = req.body;
    const redirect = `/admin/item/show-detail-item/${itemId}`;
    try {
      const feature = await Feature.findById(id);

      if (req.file) {
        await removeImage(feature.imageUrl);
        feature.imageUrl = fileUrl(req.file);
      }
      feature.name = name;
      feature.qty = qty;
      await feature.save();

      flashRedirect(req, res, "success", "Success Update Feature", redirect);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, redirect);
    }
  },

  deleteFeature: async (req, res) => {
    const { id, itemId } = req.params;
    const redirect = `/admin/item/show-detail-item/${itemId}`;
    try {
      const feature = await Feature.findById(id);
      await Item.findByIdAndUpdate(itemId, { $pull: { featureId: feature._id } });
      await removeImage(feature.imageUrl);
      await feature.deleteOne();

      flashRedirect(req, res, "success", "Success Delete Feature", redirect);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, redirect);
    }
  },

  addActivity: async (req, res) => {
    const { name, type, itemId } = req.body;
    const redirect = `/admin/item/show-detail-item/${itemId}`;
    try {
      if (!req.file) {
        return flashRedirect(req, res, "danger", "Image Not Found", redirect);
      }

      const activity = await Activity.create({
        name,
        type,
        itemId,
        imageUrl: fileUrl(req.file),
      });

      await Item.findByIdAndUpdate(itemId, { $push: { activityId: activity._id } });
      flashRedirect(req, res, "success", "Success Add Activity", redirect);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, redirect);
    }
  },

  updateActivity: async (req, res) => {
    const { id, name, type, itemId } = req.body;
    const redirect = `/admin/item/show-detail-item/${itemId}`;
    try {
      const activity = await Activity.findById(id);

      if (req.file) {
        await removeImage(activity.imageUrl);
        activity.imageUrl = fileUrl(req.file);
      }
      activity.name = name;
      activity.type = type;
      await activity.save();

      flashRedirect(req, res, "success", "Success Update Activity", redirect);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, redirect);
    }
  },

  deleteActivity: async (req, res) => {
    const { id, itemId } = req.params;
    const redirect = `/admin/item/show-detail-item/${itemId}`;
    try {
      const activity = await Activity.findById(id);
      await Item.findByIdAndUpdate(itemId, { $pull: { activityId: activity._id } });
      await removeImage(activity.imageUrl);
      await activity.deleteOne();

      flashRedirect(req, res, "success", "Success Delete Activity", redirect);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, redirect);
    }
  },

  viewBooking: async (req, res) => {
    try {
      const booking = await Booking.find().populate("memberId").populate("bankId");
      res.render("admin/booking/view_booking", {
        title: "Staycation | Booking",
        booking,
        user: req.session.user,
      });
    } catch (error) {
      res.redirect("/admin/booking");
    }
  },

  showDetailBooking: async (req, res) => {
    const { id } = req.params;
    try {
      const booking = await Booking.findById(id)
        .populate("memberId")
        .populate("bankId");

      res.render("admin/booking/show_detail_booking", {
        title: "Staycation | Detail Booking",
        booking,
        alert: readAlert(req),
        user: req.session.user,
      });
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, `/admin/booking/${id}`);
    }
  },

  actionConfirm: async (req, res) => {
    const { id } = req.params;
    try {
      await Booking.findByIdAndUpdate(id, { "payments.status": "Accepted" });
      flashRedirect(req, res, "success", "Success Confirm Payment", `/admin/booking/${id}`);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, `/admin/booking/${id}`);
    }
  },

  actionReject: async (req, res) => {
    const { id } = req.params;
    try {
      await Booking.findByIdAndUpdate(id, { "payments.status": "Rejected" });
      flashRedirect(req, res, "success", "Success Reject Payment", `/admin/booking/${id}`);
    } catch (error) {
      flashRedirect(req, res, "danger", error.message, `/admin/booking/${id}`);
    }
  },
};
