const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  userId: String,
  name: String,
  role: {
    type: String,
    enum: ["tutor", "student"],
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique: true,
    required: true,
  },
  tutor: {
    name: String,
    userId: String,
  },

  permissions: {
    canDraw: Boolean,
    canChat: Boolean,
  },
  participants: [participantSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", roomSchema);
