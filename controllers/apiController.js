const Item = require("../models/Item");
const Treasure = require("../models/Activity");
const Traveler = require("../models/Booking");
const Category = require("../models/Category");
const Bank = require("../models/Bank");
const Member = require("../models/Member");
const Booking = require("../models/Booking");
const cloudinary = require("../third-party/cloudinary");

const Joi = require("joi");

module.exports = {
  landingPage: async (req, res) => {
    try {
      const treasure = await Treasure.find();
      const traveler = await Traveler.find();
      const city = await Item.find();

      const mostPicked = await Item.find()
        .select("_id title country city price unit")
        .limit(5)
        .populate({ path: "imageId", select: "_id imageUrl" });

      const mostPickedData = mostPicked.map((item) => ({
        ...item._doc,
        imageId: item.imageId.map((image) => ({
          ...image._doc,
          imageUrl: cloudinary.url(image.imageUrl),
        })),
      }));

      const category = await Category.find()
        .select("_id name")
        .limit(3)
        .populate({
          path: "itemId",
          select: "_id title country city isPopular imageId",
          perDocumentLimit: 4,
          option: {
            sort: {
              sumBooking: -1,
            },
          },
          populate: {
            path: "imageId",
            select: "_id imageUrl",
            perDocumentLimit: 1,
          },
        });

      for (let i = 0; i < category.length; i++) {
        for (let j = 0; j < category[i].itemId.length; j++) {
          const item = await Item.findOne({ _id: category[i].itemId[j]._id });
          item.isPopular = false;
          await item.save();
          if (category[i].itemId[0] === category[i].itemId[j]) {
            item.isPopular = true;
            await item.save();
          }
        }
      }

      const categoryData = category.map((item) => ({
        ...item._doc,
        itemId: item.itemId.map((value) => ({
          ...value._doc,
          imageId: value.imageId.map((image) => ({
            ...image._doc,
            imageUrl: cloudinary.url(image.imageUrl),
          })),
        })),
      }));

      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: cloudinary.url("staycation_images/testimonial1.jpg"),
        name: "Happy Family",
        rate: 4.55,
        content:
          "What a great trip with my family and I should try again next time soon ...",
        familyName: "Rakasiwi Surya",
        familyOccupation: "Fullstack Developer",
      };

      res.status(200).json({
        hero: {
          travelers: traveler.length,
          treasures: treasure.length,
          cities: city.length,
        },
        mostPicked: mostPickedData,
        categories: categoryData,
        testimonial,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "Failed",
        message: "Internal server error",
      });
    }
  },

  detailPage: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await Item.findOne({ _id: id })
        .populate({ path: "featureId", select: "_id name qty imageUrl" })
        .populate({ path: "activityId", select: "_id name type imageUrl" })
        .populate({ path: "imageId", select: "_id imageUrl" });

      const itemData = {
        ...item._doc,
        featureId: item.featureId.map((feature) => ({
          ...feature._doc,
          imageUrl: cloudinary.url(feature.imageUrl),
        })),
        activityId: item.activityId.map((activity) => ({
          ...activity._doc,
          imageUrl: cloudinary.url(activity.imageUrl),
        })),
        imageId: item.imageId.map((image) => ({
          ...image._doc,
          imageUrl: cloudinary.url(image.imageUrl),
        })),
      };

      const bank = await Bank.find();

      const bankData = bank.map((item) => ({
        ...item._doc,
        imageUrl: cloudinary.url(item.imageUrl),
      }));

      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: cloudinary.url("staycation_images/testimonial1.jpg"),
        name: "Happy Family",
        rate: 4.55,
        content:
          "What a great trip with my family and I should try again next time soon ...",
        familyName: "Rakasiwi Surya",
        familyOccupation: "Fullstack Developer",
      };

      res.status(200).json({
        ...itemData,
        bank: bankData,
        testimonial,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "Failed",
        message: "Internal server error",
      });
    }
  },

  bookingPage: async (req, res) => {
    const {
      itemId,
      duration,
      bookingStartDate,
      bookingEndDate,
      firstName,
      lastName,
      email,
      phoneNumber,
      accountHolder,
      bankFrom,
    } = req.body;

    try {
      const schema = Joi.object({
        itemId: Joi.string().required(),
        duration: Joi.number().required(),
        bookingStartDate: Joi.date().required(),
        bookingEndDate: Joi.date().required(),
        firstName: Joi.string().min(3).max(20).required(),
        lastName: Joi.string().min(3).max(20).required(),
        email: Joi.string().email().required(),
        phoneNumber: Joi.number().required(),
        accountHolder: Joi.string().min(3).max(20).required(),
        bankFrom: Joi.string()
          .valid("BCA", "bca", "Mandiri", "mandiri")
          .required(),
      });

      const { error } = schema.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: "Failed",
          message: error.details[0].message,
        });
      }

      if (!req.file) {
        return res.status(404).json({
          status: "Failed",
          message: "Image not found",
        });
      }

      if (
        !itemId ||
        !duration ||
        !bookingStartDate ||
        !bookingEndDate ||
        !firstName ||
        !lastName ||
        !email ||
        !phoneNumber ||
        !accountHolder ||
        !bankFrom
      ) {
        return res.status(400).json({
          status: "Failed",
          message: "Please fill the field",
        });
      }

      const item = await Item.findOne({ _id: itemId });

      if (!item) {
        return res.status(404).json({
          status: "Failed",
          message: "Item not found",
        });
      }

      item.sumBooking += 1;
      await item.save();

      let total = item.price * duration;
      let tax = total * 0.1;
      const invoice = Math.floor(1000000 + Math.random() * 9000000);

      const member = await Member.findOne({ email });

      if (!member) {
        await Member.create({
          firstName,
          lastName,
          email,
          phoneNumber,
        });
      }

      let bankId;
      if (bankFrom === "BCA" || bankFrom === "bca") {
        const bank = await Bank.findOne({ nameBank: "BCA" });
        bankId = bank._id;
      } else {
        const bank = await Bank.findOne({ nameBank: "Mandiri" });
        bankId = bank._id;
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "staycation_images",
        use_filename: true,
        unique_filename: false,
      });

      const newBooking = {
        invoice,
        bookingStartDate,
        bookingEndDate,
        total: (total += tax),
        itemId: {
          _id: item._id,
          title: item.title,
          price: item.price,
          duration: duration,
        },
        memberId: member._id,
        payments: {
          proofPayment: result.public_id,
          bankFrom,
          accountHolder,
        },
        bankId,
      };

      const booking = await Booking.create(newBooking);

      res.status(201).json({
        status: "Success",
        message: "Success booking",
        booking,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "Failed",
        message: "Internal server error",
      });
    }
  },
};
