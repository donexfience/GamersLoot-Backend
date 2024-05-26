const mongoose = require("mongoose");
const Category = require("./categoryModel");
const Schema = mongoose.Schema;

const OfferSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  offer: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  startingDate: {
    type: Date,
    required: true,
  },
  endingDate: {
    type: Date,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: Category,
    required: true
}
});

const offerModel = mongoose.model("CatOffer", OfferSchema);

module.exports = offerModel;
