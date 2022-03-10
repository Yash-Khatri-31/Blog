const express = require('express');
const {randomBytes} = require('crypto')
const bodyParser = require('body-parser')
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const commentByID = {};

app.get('/posts/:id/comments', (req,res) => {
    res.send(commentByID[req.params.id] || [])
});

app.post('/posts/:id/comments', async (req,res) => {
    const commentId = randomBytes(4).toString('hex');
    const {content} = req.body;
    const comments = commentByID[req.params.id] || [];
    comments.push({id: commentId, content, status:"pending"});
    commentByID[req.params.id] = comments;

    await axios.post("http://eventbus-srv:4005/events", {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status:'pending'
        },
    })
    res.status(201).send(comments)
})

app.post('/events', async (req,res) => {

    console.log('Recieved Event', req.body.type)

    const {type, data} = req.body;

    if(type === 'CommentModerated'){
        const {postId, id, status, content} = data;
        const comments = commentByID[postId];
        const comment = comments.find((comment) => { return comment.id === id });
        comment.status = status;

    await axios.post('http://eventbus-srv:4005/events', {
        type: 'CommentUpdated',
        data: {
            id,
            postId,
            content,
            status
            }
        })
    }

    res.send({})
})

app.listen(5000, () => {
    console.log('Listening on Port 5000')
})