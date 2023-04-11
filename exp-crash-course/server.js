const express = require('express');
const app = express();
app.set('view engine', "ejs")
app.use(express.static("public"))

app.use(express.urlencoded({extended:true}))
// app.get('/',logger,(req,res)=>{
//     console.log('Here')
//     res.render('index',{text: 'world'})
// })

const userRouter= require('./routes/users')
// app.get('/test',(req,res)=>{
//     console.log("here")
//     res.send("Good")
// })

app.use('/users',userRouter)
function logger(req, res, next){
    console.log(req.originalUrl)
    next()
}

app.listen(3000);
