const Item = require("../models/Item");
const Activity = require("../models/Activity");
const Category = require("../models/Category");
const Bank = require("../models/Bank");
const Member = require("../models/Member");
const Booking = require("../models/Booking");
const { fileUrl } = require("../helpers/storage");

const TESTIMONIAL = {
  _id: "asd1293uasdads1",
  imageUrl: "images/testimonial1.jpg",
  name: "Happy Family",
  rate: 4.55,
  content:
    "What a great trip with my family and I should try again next time soon ...",
  familyName: "Rakasiwi Surya",
  familyOccupation: "Fullstack Developer",
};

module.exports = {
  landingPage: async (req, res) => {
    try {
      const [treasureCount, travelerCount, cityCount] = await Promise.all([
        Activity.countDocuments(),
        Booking.countDocuments(),
        Item.countDocuments(),
      ]);

      const mostPicked = await Item.find()
        .select("_id title country city price unit")
        .limit(5)
        .populate({ path: "imageId", select: "_id imageUrl" });

      const categories = await Category.find()
        .select("_id name")
        .limit(3)
        .populate({
          path: "itemId",
          select: "_id title country city isPopular imageId",
          perDocumentLimit: 4,
          options: { sort: { sumBooking: -1 } },
          populate: {
            path: "imageId",
            select: "_id imageUrl",
            perDocumentLimit: 1,
          },
        });

      // The first (most-booked) item of every category is flagged "Popular".
      for (const category of categories) {
        await Promise.all(
          category.itemId.map((item, index) =>
            Item.findByIdAndUpdate(item._id, { isPopular: index === 0 })
          )
        );
      }

      res.status(200).json({
        hero: {
          travelers: travelerCount,
          treasures: treasureCount,
          cities: cityCount,
        },
        mostPicked,
        categories,
        testimonial: TESTIMONIAL,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Failed", message: "Internal server error" });
    }
  },

  detailPage: async (req, res) => {
    try {
      const item = await Item.findById(req.params.id)
        .populate({ path: "featureId", select: "_id name qty imageUrl" })
        .populate({ path: "activityId", select: "_id name type imageUrl" })
        .populate({ path: "imageId", select: "_id imageUrl" });

      if (!item) {
        return res.status(404).json({ status: "Failed", message: "Item not found" });
      }

      const bank = await Bank.find();

      res.status(200).json({ ...item.toObject(), bank, testimonial: TESTIMONIAL });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Failed", message: "Internal server error" });
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
        return res.status(400).json({ status: "Failed", message: "Image not found" });
      }

      const requiredFields = {
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
      };
      if (Object.values(requiredFields).some((value) => !value)) {
        return res.status(400).json({ status: "Failed", message: "Please fill the field" });
      }

      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ status: "Failed", message: "Item not found" });
      }

      item.sumBooking += 1;
      await item.save();

      const subtotal = item.price * duration;
      const tax = subtotal * 0.1;
      const invoice = Math.floor(1000000 + Math.random() * 9000000);

      let member = await Member.findOne({ email });
      if (!member) {
        member = await Member.create({ firstName, lastName, email, phoneNumber });
      }

      const booking = await Booking.create({
        invoice,
        bookingStartDate,
        bookingEndDate,
        total: subtotal + tax,
        itemId: {
          _id: item._id,
          title: item.title,
          price: item.price,
          duration,
        },
        memberId: member._id,
        payments: {
          proofPayment: fileUrl(req.file),
          bankFrom,
          accountHolder,
        },
      });

      res.status(201).json({
        status: "Success",
        message: "Success booking",
        booking,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Failed", message: "Internal server error" });
    }
  },
};
