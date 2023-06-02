const express = require('express');
const app = express();
const port = process.env.port||3000;
const fs = require("fs")
const path = require("path")
const cors = require("cors")
const bodyParser = require('body-parser');

const client = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

const uri = "mongodb+srv://ebbothesix:Dracoebbo1@cluster0.e5w2xqs.mongodb.net/test";

let db;
client.connect(uri,(err,cli)=>{
    db = cli.db('webstore1');
});

app.use(cors())
app.use((req,res,next)=>{
    let dt = new Date();
    let formatted_date = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`
    let formatted_log = `[${formatted_date}] ${req.method}:${req.url} ${res.statusCode}`;
    console.log(formatted_log);
    next()
});

app.use(express.json());

app.use((req,res,next)=>{
    const filePath = path.join(__dirname,"static/images",req.url)
    fs.stat(filePath, (err, info) =>{
        if (err) {
            next()
            return
        }else{
            if (info.isFile()) {
                res.sendFile(filePath)
            }else{
                next()
            }
        }
    })
})

app.param('collectionName',(req,res,next,collectionName)=>{
    if (db != undefined) {
        req.collection = db.collection(collectionName);
    }
    return next()
})


app.get('/',(req,res)=>{
    res.send("Welcome")
});

// Route for sending images
app.get('/collection/:collectionName', (req, res) => {
    req.collection.find({}).toArray((e,results)=>{
        if (e) return next(e);
        res.send(results)
    })
});

app.get('/search-lessons/collection/:collectionName/:mode/:query', (req, res) => {
    if (!req.body)return {"msg":"failed"}
    
    switch (`${req.params.mode}`.toLowerCase()) {
        case "subject":
            req.collection.find({subject: new RegExp(req.params.query, 'i')}).toArray((e,results)=>{
                if (e) return next(e);
                res.send(results)
            })
            break;
        case "location":
            req.collection.find({location: new RegExp(req.params.query, 'i')}).toArray((e,results)=>{
                if (e) return next(e);
                res.send(results)
            })
            break;
        case "price":
            req.collection.find({price: parseFloat(req.params.query)}).toArray((e,results)=>{
                if (e) return next(e);
                res.send(results)
            })
            break;
        default:
            next(e)
            break;
    }
});

app.get("/collection/:collectionName/:id",(req,res,next)=>{
    req.collection.findOne({_id: new ObjectId(req.params.id)},(e,results)=>{
        if (e) return next(e);
        res.send(results)
    })
})

app.put("/collection/:collectionName/:id",(req,res,next)=>{
    req.collection.updateOne(
    {_id: new ObjectId(req.params.id)},
    {$set:req.body},
    {safe: true, multi:false},
    (e,results)=>{
        if (e) return next(e)
        res.send(results.result.n == 1 ? {msg: true} : {msg:false})
    })
})

app.post('/collection/:collectionName', bodyParser.json(), (req, res) => {
    req.collection.insertOne(req.body,(e,results)=>{
        if (e) return next(e)
        res.send(results.ops)
    })
});

app.delete('/collection/:collectionName', bodyParser.json(), (req, res) => {
    req.collection.deleteOne(
        {_id: new ObjectId(req.params.id)},
        (e,results)=>{
            if (e) return next(e)
            res.send(results.result.n == 1 ? {msg: true} : {msg:false})
        })
});

app.listen(port, () => {
  console.log(`Server is running on port http://127.0.0.1:${port}`);
});