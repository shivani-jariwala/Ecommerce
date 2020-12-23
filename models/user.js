const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email:{
    type: String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  resetToken:String,
  resetTokenExpiration:Date,
  cart:{
    items:[{productId:{type:Schema.Types.ObjectId,ref:'Product',required:true},
      quantity:{type:Number, required:true}
          }]
  }
});

userSchema.methods.addToCart = function(product){ //this is how mongoose allows us to write our own methods
        const cartProductIndex = this.cart.items.findIndex(cp=>{
          return cp.productId.toString() === product._id.toString();
        });
        let newQuantity=1;
        const updatedCartItems =[...this.cart.items];
        if(cartProductIndex >=0){//update quntity //cartproductindex>=0 indicates that index exists meaning the product in cart exists
          newQuantity = this.cart.items[cartProductIndex].quantity+1;
          updatedCartItems[cartProductIndex].quantity = newQuantity;
        }else{
          updatedCartItems.push({productId:product._id,quantity :1}) 
        }
        
      
        //const updatedCart = {items : [{...product,quantity :1}] }; //this creates updatedCart which has items array ,we use spread operator(...) which takes all product and adds a quantity field to 1 which is same as product.quantity =1;
        const updatedCart = { //create 1st quantity
          items : updatedCartItems 
          }; // we did this bcoz we dont want all product info in cart bcoz that meant any change in product needs to be refelcted in cart also, so we'll only refer the productId
        
        this.cart = updatedCart;
        return this.save();
};

userSchema.methods.removeFromCart = function(productId){
  const updatedCartItems =  this.cart.items.filter(item =>{ //returns array when true is returned. when false is returned it is not stored in the array
           return item.productId.toString() !== productId.toString();
         });
         this.cart.items = updatedCartItems;
         return this.save();  
};
userSchema.methods.clearCart = function(){
  this.cart = {items:[]};
  return this.save();
} 


module.exports = mongoose.model('User',userSchema);





// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// const ObjectId = mongodb.ObjectId;


// class User{
//   constructor(username,email,cart,id){
//     this.name=username;
//     this.email=email;
//     this.cart =cart; //{items:[]}
//     this._id=id;
//   }
//   save(){
//     const db = getDb();
//     return db
//       .collection('users')
//       .insertOne(this)

//   }

//   addToCart(product){
//     
//   }

//   getCart(){
//     const db = getDb();
//     const productIds=this.cart.items.map(i=>{
//       return i.productId;
//     });
//    return db
//     .collection('products') 
//     .find({_id: { $in :productIds}})
//     .toArray()
//     .then(products =>{
//       return products.map(p=>{
//         return {...p, quantity:this.cart.items.find(i=>{
//           return i.productId.toString()===p._id.toString();
//         }).quantity 
//       };
//       });
//     });
//   }

//   deleteItemFromCart(productId){
//     const updatedCartItems =  this.cart.items.filter(item =>{ //returns array when true is returned. when false is returned it is not stored in the array
//       return item.productId.toString() !== productId.toString();
//     });
//     const db = getDb();
//     return db
//       .collection('users')
//       .updateOne(
//         {_id : new ObjectId(this._id)},
//         {$set:{cart:{items:updatedCartItems}}} //cart field in users database will be replaced by updatedCart
//       );

//   }
//   addOrder(){
//     const db = getDb();
//     return this.getCart()
//       .then(products =>{
//         const order = {
//           items: products,
//           user:{
//             _id: new ObjectId(this._id),
//             name:this.name,
          
//         }
//     };
//     return db
//       .collection('orders') //create a new collection named orders
//       .insertOne(order) }) //.insertOne(this.cart) //before emptying the cart take the cart in the orders collection
//       .then(result=>{
//         this.cart = { items:[]}; //empty the cart
//         return db
//           .collection('users')
//           .updateOne(
//             {_id : new ObjectId(this._id)},
//             {$set:{cart:{items:[]}}} //empty the cart in database
//           );
//       })
//     }

//   getOrders(){
//     const db = getDb();
//     return db 
//       .collection('users')
//       .find({'user._id':new ObjectId(this._id)}) //'user._id' is a filter which means in under user see for id
//       .toArray();
//   }

//   static findById(userId){
//     const db = getDb();
//     return db
//       .collection('users').findOne({_id:new ObjectId(userId)})
//       .then(user=>{
//         console.log(user);
//         return user;
//       }) 
//       .catch(err=>{
//         console.log(err);
//       });   
//   }
// }


// module.exports = User;
