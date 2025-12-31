const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");

const FRONTEND_URL = process.env.frontend_url || "https://whiteboard-frontend-plum.vercel.app";

/**
 * Create room + tutor link
 */
exports.generateTutorLink = async (req, res) => {
  try {
    const { tutorName, permissions } = req.body;

    let roomId = Math.random().toString(36).slice(2, 8);
    const suf_tutorId = Math.random().toString(36).slice(8,12);
    const tutorId = "tutor_"+suf_tutorId

    //check if roomId already exists
    const existingRoom = await Room.findOne({ roomId });
    console.log({existingRoom:roomId});
  
    if (existingRoom) {
      return res.status(500).json({ message: "Room ID collision, please try again" });
    }

    const room = await Room.create({
      roomId,
      tutor: {
        name: tutorName,
        userId: tutorId,
      },
      permissions,
    });

    const url = `${FRONTEND_URL}/room/${roomId}?role=tutor`;

    res.status(201).json({ url,time:Date.now(),roomId ,tutorId});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create tutor room" });
  }
};

/**
 * Generate student link using tutorId
 */
exports.generateStudentLink = async (req, res) => {
  try {
    const {roomId, tutorId } = req.body;
    const exitRoomId = await Room.findOne({ roomId });
    if (!exitRoomId) {
      return res.status(404).json({ message: "Room ID not found" });
    }
    const tutor = await Room.findOne({ "tutor.userId": tutorId });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    const url = `${FRONTEND_URL}/room/${exitRoomId.roomId}?role=student`;

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate student link" });
  }
};
