const User = require('../models/usermodel')
const bcrypt = require('bcryptjs')
const { check, validationResult} = require("express-validator")
const jwt = require('jsonwebtoken')

const register = async (req,res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = {};
      errors.array().forEach(error => {
        err[error.param] = error.msg;
      });
      return res.status(422).json({ errors: err });
    }
    const {
        username,
        email,
        password
    } = req.body;
try {
    let user = await User.findOne({
      username,
      email
    });
    if (user) {
        return res.status(400).json({
            msg: "User Already Exists"
        });
    }

    user = new User({
        username ,
        email,
        password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
        user: {
            id: user.id
        }
    };

    jwt.sign(
        payload,
        "randomString", {
            expiresIn: 10000
        },
        (err, token) => {
            if (err) throw err;
            res.status(200).json({
                message:"registered succesfully",
                token
            });
        }
    );
} catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Saving");
}
};

const login = async (req,res,next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = {};
      errors.array().forEach(error => {
        err[error.param] = error.msg;
      });
      return res.status(422).json({ errors: err });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (!user){
        return res.status(400).json({
          message: "User Not Exist"
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch){
        return res.status(400).json({
          errors:{ password:"Incorrect Password !" }
        });
      }

      const payload = {
        user: {
          id: user.id
        }
      };
      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            message:"logged in succesfully",
            user,
            token
          });
          res.render("dashboard");
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  };

  module.exports = { 
	register,
	login
}