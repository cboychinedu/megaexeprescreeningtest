// Importing the necessary modules 
const express = require('express'); 
const session = require('express-session'); 
const mongodbSession = require('connect-mongodb-session')(session); 
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs'); 
const path = require('path'); 
const multer = require('multer'); 
const { USERS, POST } = require('../models/validation'); 

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