const insertdata= async (data,user_details)=>{
    const user_data=new user_details({
        name:data.name,
        house:data.house,
        locality:data.locality,
        pincode:data.pincode,
        phone:data.phone,
        orderID:data.order_ID
        })
        user_data.save(function (err,user_t) {
            if (err) return console.error(err);
          });        
}
module.exports={insertdata};
