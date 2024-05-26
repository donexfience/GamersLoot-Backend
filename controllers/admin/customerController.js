const User = require("../../model/userModel");
const getCustomers = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      startingDate,
      endingDate,
    } = req.query;

    let filter = {};
    console.log("status", status);
    if (status) {
      if (status === "active") {
        filter.isActive = true;
      } else {
        filter.isActive = false;
      }
    }

    if (search) {
      if (search.includes(" ")) {
        const [firstName, lastName] = search.split(" ");
        filter.firstName = { $regex: new RegExp(firstName, "i") };
        filter.lastName = { $regex: new RegExp(lastName, "i") };
      } else {
        filter.$or = [
          { firstName: { $regex: new RegExp(search, "i") } },
          { lastName: { $regex: new RegExp(search, "i") } },
        ];
      }
    }
    // Date
    if (startingDate) {
      const date = new Date(startingDate);
      filter.createdAt = { $gte: date };
    }

    if (endingDate) {
      const date = new Date(endingDate);
      filter.createdAt = { ...filter.createdAt, $lte: date };
    }

    const skip = (page - 1) * limit;
    console.log(filter.createdAt, "------------ w1");

    // Getting all users
    const customers = await User.find(
      { role: "user", ...filter },
      {
        password: 0,
        dateOfBirth: 0,
        role: 0,
        walletBalance: 0,
        isEmailVerified: 0,
      }
    )
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalAvailableUsers = await User.countDocuments({
      role: "user",
      ...filter,
    });

    res.status(200).json({ customers, totalAvailableUsers });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//getting the single customer

const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    res.status(200).json({ msg: `User id ${id}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// deleting the customer

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const customer = await User.findOneAndDelete({ _id: id });

    if (!customer) {
      throw Error("No Such User");
    }

    res.status(200).json({ customer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//block or unblock the customer

const blockOrUnblockCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    console.log(isActive,"backend value ")

    const customer = await User.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    );
    res.status(200).json({customer})
    console.log(customer,"updated users")
  } catch (error) {
    console.error(error, "error message");
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getCustomer,
  getCustomers,
  blockOrUnblockCustomer,
  deleteCustomer,
};
