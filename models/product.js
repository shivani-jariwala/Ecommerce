const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({  //Schema defines the structure of the document
  title:{
    type:String,
    required:true
  },
  price:{
    type:Number,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  imageUrl:{
    type:String,
    required:true
  },
  userId:{
    type:Schema.Types.ObjectId,
    ref:'User', //ref here shows a reference with the User schema
    required:true
  }



});
module.exports = mongoose.model('Product',productSchema); //model creates a duplicate for schema, basically schema is blueprint and Product is created in the way of this defined schema(2nd argument)




// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product{
//   constructor(title,price,description,imageUrl,id,userId){
//     this.title=title;
//     this.price=price;
//     this.description=description;
//     this.imageUrl=imageUrl;
//     //this._id=id;
//     //this._id = new mongodb.ObjectId(id)
//     this._id = id ? new mongodb.ObjectId(id) : null; //ternary operation is used bcoz even when no id is passed the above commented line always created a new mongodb objectid object and therefore the if block will always be defined and hence always updation and no new add product
//     this.userId=userId;
//   }

//   save(){
//     const db=getDb(); // got the connection
//     let dbOp;
//     if(this._id){
//       //update the existing product
//       dbOp=db.collection('products').updateOne({_id:this._id},{$set:this} ); //{$set: this} specifies that all the fields has to be replaced by this new ones. we could also write it as title:this.title and so on
//     }else{
//       //add new product
//       dbOp=db.collection('products').insertOne(this);
//     }
//     return db.collection('products')             //since got connection now work with collection.
//       .insertOne(this)
//       .then(result=>{
//         console.log(result);
//       })
//       .catch(err=>{
//         console.log(err)});
//   }
//   static fetchAll(){
//     const db=getDb();
//     return db
//     .collection('products')
//     .find() //find returns a cursor which points to that doc, toArray returns that doc at which the cursor is pointing in array format
//     .toArray()
//     .then(products=>{
//       console.log(products);
//       return products;
      
//     })
//     .catch(err=>{
//       console.log(err);
//     })
//   }

//   static findById(prodId){
//     const db=getDb();
//     return db
//     .collection('products')
//     .find({_id : new mongodb.ObjectId(prodId)}) // find method uses filter and returns an object// objectid is used bcoz mongodb stores id differently as sring
//     .next()  // find method points to cursor and next method brings the doc one by one unlike the toArray method which returns all docs matching the condition
//     .then(product =>{ //also mongodb stored id as _id
//       console.log(product);
//       return product;
//     })
//     .catch(err=>{
//       console.log(err);
//     })
    
//   }  
//   static deleteById(prodId){
//     const db=getDb();
//     return db
//     .collection('products')
//     .deleteOne({_id:new mongodb.ObjectId(prodId)})       //new mongodb.Obejctid(prodid) this line is written so as to convert the prodId to objectid type
//     .then(result =>{ 
//       console.log('Deleted');
//     })
//     .catch(err=>{
//       console.log(err);
//     })
//   }  

// };

// module.exports = Product;
