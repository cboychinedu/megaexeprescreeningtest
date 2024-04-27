// Import the necessary modules 
const mongodb = require('mongoose'); 

// Creating a schema for the users 
const usersSchema = new mongodb.Schema({
    firstname: { type: String, required: true}, 
    lastname: { type: String, required: true}, 
    emailAddress: { type: String, required: true}, 
    password: { type: String, required: true }, 
    date: { type: Date, default: Date.now }
})

const replySchema = new mongodb.Schema({
    content: {
      type: String,
      required: true
    },
    user: {
      type: mongodb.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }, { timestamps: true });
  
  const commentSchema = new mongodb.Schema({
    content: {
      type: String,
      required: true
    },
    user: {
      type: mongodb.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    replies: [replySchema]
  }, { timestamps: true });
  

// Creating a schema for the users post 
const usersPost = new mongodb.Schema({
    imageUrl: { type: String}, 
    content: { type: String}, 
    category: { type: String},
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0},
    comments: [commentSchema], 
    date: { type: Date, default: Date.now }
})



// Connecting the user's collection 
const USERS = mongodb.model('users', usersSchema); 
const POST = mongodb.model('post', usersPost); 

// Exporting the schema 
module.exports.USERS = USERS; 
module.exports.POST = POST; 
