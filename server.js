const express=require("express");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const cors = require('cors'); 
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app=express();
const port=process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: false }));

mongoose.connect("mongodb://localhost:27017/cart_users",{useNewUrlParser:true})
.then(()=>app.listen(port))
.catch((err)=>console.log(err));

app.use(bodyParser.urlencoded({extended:true}));
app.get("/",function(req,res)
{res.send("HELLO")});

const address_schema=new mongoose.Schema({
  name:String,
  house:String,
  locality:String,
  pincode:String,
  phone:String,
  amt:Number,
  orderID:String,
  items: [{  name: String,
    price: Number,
    quantity: Number,
    img: String
  }],
  d_date:String
});

const item_schema=new mongoose.Schema({
  name:String,
  price:Number,
  status:String,
  img:String,
  currency:String
});
  
  const user_details=new mongoose.model("user_details",address_schema);
  const item_details=new mongoose.model("item_lists",item_schema);

app.post("/orders",function(req,res)
{const {mobile}=req.body;
  user_details.find({"phone": mobile}, function(err, result){
    if(err){
        console.log(err);
    }
    else {
        res.send(result);
    }
});})

app.post("/item_list",function(req,res)
{
  item_details.find({}, function(err, result){
    if(err){
        console.log(err);
    }
    else {
        res.send(result);
    }
});})

const insertdata= async (data,user_details)=>{
  const user_data=new user_details({
      name:data.name,
      house:data.house,
      locality:data.locality,
      pincode:data.pincode,
      phone:data.phone,
      amt:data.amt,
      orderID:data.order_ID,
      items:data.items,
      d_date:data.d_date,
      })
      user_data.save(function (err,user_t) {
          if (err) return console.error(err);
        });        
}

app.post("/payment",async (req, res)=>
{ 
  const instance = new Razorpay({
    key_id: "rzp_test_zotXtENdy5l3Ik", // YOUR RAZORPAY KEY
    key_secret: "xHWXlZ4yDxixU4VKGJPfFlzi", // YOUR RAZORPAY SECRET
  });
  let {yname,house,locality,pincode,phone,amount,orderID,list,d_date}=req.body;

  const options = {
    amount: amount*100,
    currency: 'INR',
    receipt: orderID,
  };

  const order = await instance.orders.create(options);

  if (!order) return res.status(500).send('Some error occured');

  res.send(order);
});

app.post("/success",async (req, res)=>{
  try {
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    const shasum = crypto.createHmac('sha256', '<YOUR RAZORPAY SECRET>');
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature)
      return res.status(400).json({ msg: 'Transaction not legit!' });

    const newPayment = PaymentDetails({
      razorpayDetails: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      },
      success: true,
    });

    await newPayment.save();

    res.json({
      msg: 'success',
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/address",function(req,res)
{const {yname,house,locality,pincode,phone,amount,orderID,list,d_date}=req.body;
    var data={
    "name":yname,
    "house":house,
    "locality":locality,
    "pincode":pincode,
    "phone":phone,
    "amt":amount,
    "order_ID":orderID,
    "items":list,
    "d_date":d_date,
}
insertdata(data,user_details);
})

