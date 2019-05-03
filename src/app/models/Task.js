const mongoose = require("../../database");

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    ofUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    ofPolice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police"
    },
    completed: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;
