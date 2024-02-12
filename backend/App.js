const express = require('express');
const app = express();
const port = 8000;
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodeMailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


async function dbConnect() {
    try {
      await mongoose.connect("mongodb+srv://harsxhhhh:genshin123@cluster0.vpqbkns.mongodb.net/?retryWrites=true&w=majority", {
      });
      console.log("Database Connected Successfully");
    } catch (error) {
      console.log(error.message);
    }
  }
dbConnect();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    verify: {
        type: Boolean,
        default: false
    }
});
const User = mongoose.model('Users_Assignment', userSchema);

app.post('/api/register', async (req, res) => {
    try{
     
        const userExists = await User.findOne({ email: req.body.data.email });
        if (userExists) return res.status(400).send();
        
    const user = new User({
        name: req.body.data.name,
        email: req.body.data.email,
        password: bcrypt.hashSync(req.body.data.password, 10),
    });
    await user.save();
    console.log(user);
    res.status(200).send({ message: 'User registered', user });}
    catch(err){
        console.log(err.message);
        res.status(500).send({message:err.message});
    }
});


const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: "hhrx0040@gmail.com",
        pass: "uwowywehbhyexvpc"
    }
});

app.post('/api/sendmail', async (req, res) => {
  console.log(req.body.email);
    try{
        const mailOptions = {
            from: "hhrx0040@gmail.com",
            to: req.body.email,
            subject: "Email Verification",
            text: "To verify your email, click on the link below\n http://localhost:3000/verifyemail?email="+req.body.email+"&verify=true"
        };
        await transporter.sendMail(mailOptions);
        res.status(200).send({message:"Mail sent successfully"});
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({message:err.message});
    }
});

app.post('/api/verifyemail', async (req, res) => {
  console.log("received mail: "+req.body.email);
    try{
        const user = await User.findOne({ email: req.body.email });
        if(user.verify) return res.status(400).send({message:"Email already verified"});
        user.verify = true;
        await user.save();
        console.log(user);
        res.status(200).send({message:"Email verified"});
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({message:err.message});
    }
});

app.post('/api/login', async (req, res) => {
    try {

      const { email, password } = req.body;
  
      // Input validation (Optional, but recommended)
      if (!email || !password) {
        return res.status(400).send({ message: 'Missing required fields' });
      }
  
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send({ message: 'Invalid email or password' });
      }
  
      // Check email verification (if applicable)
      if (!user.verify) {
        return res.status(400).send({message:"Email not verified"});
      }
  
      // Validate password using a secure hashing algorithm like bcrypt
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).send({ message: 'Invalid email or password' });
      }
  
      // Generate JWT token with appropriate claims and expiration time
      const token = jwt.sign({
        userId: user._id,
        email: user.email,
        // Add other relevant claims if needed
      }, 'your_secret_key', { expiresIn: '24h' });
  
      res.status(200).send({ message: 'Logged in', token });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') { // Handle validation errors differently
          res.status(400).send({ message: err.message });
        } else {
          res.status(500).send({ message: 'Internal server error' });
        }
    }
  });
  

app.post('/api/forget', async (req, res) => {
    try{
        const user = await User.findOne({ email: req
            .body.email });
        if(!user) return res.status(400).send({message:"User not found"});
        const mailOptions = {
            from: "hhrx0040@gmail.com",
            to: req.body.email,
            subject: "Password Reset",
            text: "To reset your password, click on the link below\n http://localhost:3000/resetpassword?email="+req.body.email 
        };
        await transporter.sendMail(mailOptions);
        res.status(200).send({message:"Mail sent successfully"});
    } 
    catch(err){
        console.log(err.message);
        res.status(500).send({message:err.message});
    }
});

app.patch('/api/resetpassword', async (req, res) => {
    try{
        console.log(req.body.email +" "+ req.body.password);
        const user = await User.findOne({ email: req.body.email });
        if(!user) return res.status(400).send({message:"User not found"});
        user.password = bcrypt.hashSync(req.body.password, 10);
        await user.save();
        console.log(user);
        res.status(200).send({message:"Password reset successfully"});
    }
    catch(err){
        console.log(err.message);
        res.status(500).send({message:err.message});
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});