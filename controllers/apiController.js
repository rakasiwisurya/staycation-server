const Item = require("../models/Item");
const Treasure = require("../models/Activity");
const Traveler = require("../models/Booking");
const Category = require("../models/Category");
const Bank = require("../models/Bank");
const Member = require("../models/Member");
const Booking = require("../models/Booking");

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

      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: "/images/testimonial1.jpg",
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
        mostPicked,
        category,
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

      const bank = await Bank.find();

      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: "/images/testimonial1.jpg",
        name: "Happy Family",
        rate: 4.55,
        content:
          "What a great trip with my family and I should try again next time soon ...",
        familyName: "Rakasiwi Surya",
        familyOccupation: "Fullstack Developer",
      };

      res.status(200).json({
        ...item._doc,
        bank,
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
          proofPayment: `images/${req.file.filename}`,
          bankFrom,
          accountHolder,
        },
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
