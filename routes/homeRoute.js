// Importing the necessary modules 
const express = require('express'); 
const session = require('express-session'); 
const mongodbSession = require('connect-mongodb-session')(session); 
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs'); 
const path = require('path'); 
const multer = require('multer'); 
const { USERS, POST } = require('../models/validation'); 

// sessions 
let sess; 

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
const upload = multer({ storage: storage });

// Creating the router object 
const router = express.Router(); 

// Setting the route for register route 
router.post('/register', async(req, res) => {
  // Searching the database to see if the user with the specified email address is 
  // already registered on the database 
  let newUser = await USERS.findOne({
      "emailAddress": req.body.emailAddress
  }); 

  // If the newUser is not empty execute the block of code below 
  if (newUser) {
      // If the email is found on the database, execute the block of code below 
      let errMessage = JSON.stringify({
          "message": "User already registered on the database", 
          "status": "error", 
          "statusCode": 500, 
      }); 

      // Sending the json message 
      return res.send(errMessage); 
  }

  // If the email for the user is not found, execute the block of code below 
  else {
      // Encrypt the password, connect to the database and save the user 
      let salt = await bcrypt.genSalt(5); 
      hashedPassword = await bcrypt.hash(req.body.password, salt); 

      // Saving the new registered user 
      let registeredUser = new USERS({
          firstname: req.body.firstname, 
          lastname: req.body.lastname, 
          phoneNumber: req.body.phoneNumber, 
          emailAddress: req.body.emailAddress, 
          password: hashedPassword, 
      })

      // Saving the user on the data base 
      try{
          // Saving the registered results on the database 
          let result = await registeredUser.save(); 

          // Create a success message, and send it back to the client 
          let successMessage = JSON.stringify({
              "message": "User registered on the database", 
              "status": "success", 
              "statusCode": 200, 
          }); 

          // Sending back the success message 
          return res.send(successMessage).status(200); 
      }

      // On extended error, execute the block of code below 
      catch (error) {
          // On generated errors, log them and save to disk 
          // Create the error message, and send it back to the user 
          let errorMessage = JSON.stringify({
              "message": error.toString().trim(), 
              "status": "error", 
              "statusCode": 500, 
          })

          // Sending the error message 
          return res.send(errorMessage).status(500); 
      }
  }
})


// Setting post route for the login page 
router.post('/login', async (req, res) => {
  try {
      // Searching if the user is registered on the database, before logging the 
      // the user into the system 
      let user = await USERS.findOne({
          emailAddress: req.body.emailAddress
      }); 

      // IF the email address specified was not found on the database 
      if (!user) {
          // Create the error message 
          let errorMessage = JSON.stringify({
              "message": "Invalid email or password.", 
              "status": "error", 
              "statusCode": 404,  
          })

          // Send back the error message 
          return res.send(errorMessage).status(404); 

      }

      // If the email address was found on the server 
      else {
          // Execute the block of code below 
          let userPassword = req.body.password; 
          let hashedPassword = user.password;  

          // Comparing the password to see if it is valid 
          let passwordCondition = await bcrypt.compare(userPassword, hashedPassword); 

          // Sending back a response if the password is validated 
          if (passwordCondition) {
              // Creating the user session object and place it into the request header 
              sess = req.session; 
              sess.emailAddress = req.body.emailAddress; 
              sess._id = user._id; 
              sess.isAuth = true; 
          

              // Sending the response for the successful connection 
              let successMessage = JSON.stringify({
                  "message": "User logged in", 
                  "status": "success", 
                  "statusCode": 200, 
              })

              // Sending back the success message 
              return res.send(successMessage).status(successMessage['statusCode']); 
          }

          // If the password is not validated 
          else {
              // For the password not validated 
              let errorMessage = JSON.stringify({
                  "message": "Invalid email or password.", 
                  "status": "error", 
                  "statusCode": 404, 
              })

              // Sending back the error messsage 
              return res.send(errorMessage).status(errorMessage['statusCode']); 
          }
      }

  }

  // On error 
  catch (error) {
      // On error connecting to the database, execute the block of code below 
      let errorMessage = JSON.stringify({
          "message": error.toString().trim(), 
          "status": "error", 
          "statusCode": 500, 
      })

      // Sending back the error message 
      return res.send(errorMessage).status(500); 

  }
})

// Retrieve a list of posts with timestamps, user information, and post details
router.get('/', async (req, res) => {
    // Using try catch block 
    try {
      // Find all the posts 
      const posts = await POST.find();
  
      return res.json(posts);
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Setting the routes for the create post 
router.post('/', upload.single('image'), async (req, res) => {
    const { content, category } = req.body;
    const imageUrl = req.file ? req.file.path : null;
  
    try {
      const newPost = new POST({
        content,
        category,
        imageUrl
      });
      await newPost.save();
      res.status(201).json(newPost);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Edit a post
router.put('/:id', async (req, res) => {
    // Getting the post id from the body 
    const postId = req.params.id;
    const { content, category } = req.body;
  
    // Using try catch block to find the post by it's id 
    try {
        // finding the post by the id value 
        const post = await POST.findById(postId);
  
        // If the post is not found 
        if (!post) {
            // Return an error message 
            return res.status(404).json({ error: 'Post not found' });
      }
  
      // Check if the user owns the post (you need to implement authentication logic)
      // For demonstration, let's assume req.user contains the authenticated user's info
      if (post.user !== req.user.id) {
        return res.status(403).json({ error: 'You are not authorized to edit this post' });
      }

      // Else save the new post from the new content and category 
      post.content = content || post.content;
      post.category = category || post.category;
      await post.save();

      // return the new post 
      return res.json(post);

    } 
    // On error 
    catch (err) {
        // Log the error messaage to the console 
        console.error(err);
        return res.status(500).send({ error: 'Internal Server Error' });
    }

  });
  

// Delete a post
router.delete('/:id', async (req, res) => {
    // Get the post from the request headers 
    const postId = req.params.id;
  
    try {
      const post = await POST.findById(postId);
  
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      // Check if the user owns the post (you need to implement authentication logic)
      // For demonstration, let's assume req.user contains the authenticated user's info
      if (post.user !== req.user.id) {
        return res.status(403).json({ error: 'You are not authorized to delete this post' });
      }
  
      await post.remove();
      res.json({ message: 'Post deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Upvote a post
router.post('/:id/upvote', async (req, res) => {
    const postId = req.params.id;
  
    try {
      const post = await POST.findById(postId);
  
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      post.upvotes += 1;
      await post.save();

      res.json({ message: 'Post upvoted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Downvote a post
  router.post('/:id/downvote', async (req, res) => {
    const postId = req.params.id;
  
    try {
      const post = await POST.findById(postId);
  
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      post.downvotes += 1;
      await post.save();

      res.json({ message: 'Post downvoted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


// Add a comment to a post
router.post('/:postId/comments', async (req, res) => {
    const postId = req.params.postId;
    const { content, userId } = req.body;
  
    try {
      const post = await POST.findById(postId);
  
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      const newComment = {
        content,
        user: userId,
        replies: []
      };
  
      post.comments.push(newComment);

      await post.save();
  
      res.status(201).json({ message: 'Comment added successfully', comment: newComment });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Reply to a comment
  router.post('/:postId/comments/:commentId/reply', async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const { content, userId } = req.body;
  
    try {
      const post = await POST.findById(postId);
  
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      const comment = post.comments.id(commentId);
  
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
  
      const newReply = {
        content,
        user: userId
      };
  
      comment.replies.push(newReply);
      await post.save();
  
      res.status(201).json({ message: 'Reply added successfully', reply: newReply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


// Retrive comments for a specific post 
router.get('/:postId/comments', async (req, res) => {
    const postId = req.params.postId;
  
    try {
      const post = await POST.findById(postId);
  
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      const populatedComments = await post.populate({
        path: 'comments.user',
        select: 'name picture createdAt'
      }).execPopulate();
  
      const comments = populatedComments.comments.map(comment => ({
        id: comment._id,
        content: comment.content,
        user: {
          name: comment.user.name,
          picture: comment.user.picture
        },
        createdAt: comment.createdAt,
        replies: comment.replies.map(reply => ({
          id: reply._id,
          content: reply.content,
          user: {
            name: reply.user.name,
            picture: reply.user.picture
          },
          createdAt: reply.createdAt
        }))
      }));
  
      res.json(comments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Retrieve posts sorted by time posted or by upvotes 
router.get('/sortedPosts', async(req, res) => {
    const { sortBy } = req.query; 
    let sortCriteria;

    // Determin sorting criteria based on query parameter 
    if (sortBy === 'upvotes') {
        sortCriteria = { upvotes: -1 }; 
    }
    else {
        sortCriteria = { createdAt: -1}; 
    }

    try{
        const posts = await POST.find().sort(sortCriteria).populate('user', 'name picture'); 

        // retrun the posts 
        return res.json(posts); 
    }

    // On error 
    catch(error) {
        console.log(error); 

        // Return the error message 
        return res.status(500).send({error: "Internal Server Error"})
    }
})

  
// Exporting the router object 
module.exports = router; 