require("dotenv").config();
const mongoose = require("mongoose");
const url = process.env.MonogURL;

async function main() {
  console.log("inside main function");
  await mongoose.connect(url);
  console.log("successfully connected to database");
}



main();

const userSchema = new mongoose.Schema({
  userName: String,
  firstName: String,
  lastName: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
});

const Account = mongoose.model("Account", accountSchema);



// User.collection.deleteMany({});
// Account.collection.deleteMany({});
  
module.exports = {
  User,
  Account,
};
