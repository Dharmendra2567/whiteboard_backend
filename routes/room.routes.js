const express = require("express");
const router = express.Router();

const {
  generateTutorLink,
  generateStudentLink,
} = require("../controller/room.controller");

router.post("/generate-tutor-link", generateTutorLink);
router.post("/generate-student-link", generateStudentLink);

module.exports = router;
