require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const updateEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOneAndUpdate(
      { email: "hellotahirrafique@gmail.com" },
      { email: "hello.tahirrafique@gmail.com" },
      { new: true }
    );
    if (user) {
      console.log(`Updated email for: ${user.name} to ${user.email}`);
    } else {
      console.log("User not found!");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateEmail();
