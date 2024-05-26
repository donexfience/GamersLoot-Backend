const express = require("express");
const { getCategories } = require("../controllers/global/collectionController");
const { getNewKeyboard } = require("../controllers/global/KeyboardController");
const router = express.Router();
router.get("/newkeyboard", getNewKeyboard);
router.get("/collections", getCategories);
router.get("/banner");

module.exports = router;
