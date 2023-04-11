const express = require("express");
const router = express.Router()


router.get("/", (req, res) => {
    res.send("Users List");
})

router.get("/new",(req,res)=>{
    res.render("users/new")
})

router.post('/',(req,res)=>{
    const isValid = true;
    if(isValid){
        users.push({firstName: req.body.firstName})
        res.redirect(`/users/${users.length-1}`)
    }else{
        console.log("Err");
        res.render("users/new",{firstName: req.body.firstName})
    }
})
router.route('/:id')
.get((req,res)=>{
    const userId=req.params.id;
    res.send(`Get User with ${userId}`);
})
.put((req,res)=>{
    const userId=req.params.id;
    res.send(`Update User with ${userId}`);
})
.delete((req,res)=>{
    const userId=req.params.id;
    res.send(`delete User with ${userId}`);
})
const users= [{name:"Kylie"}, {name: "Sally"}]
router.param("id", (req, res, next, id)=>{
    console.log(id)
    req.users= users[id]
    next()
})

module.exports= router;