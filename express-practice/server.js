const express = require('express')
const bodyparser = require('body-parser')
app= express();
const PORT = 6789;
app.locals.port=PORT;
app.listen(PORT, () => {console.log(`ready on ${PORT}`)});

app.use(function(req, res , next){
    console.log(`logging requests ${req.originalUrl}`);
    next();
});

function reqDetailsText(req){
    const {hostname, ip, protocol, method, path}= req;
    const obj = {hostname, ip, protocol, method, path};
    console.log("here");
    return Object.entries(obj).map(([k,v])=> `${k}=${v}`).join('\n')+'\n';
}

app.get('/reqDetails', (req, res)=>{
    res.send(reqDetailsText(req));
});

app.get('/reqDetailsText',(req,res)=>{
    res.type('text').send(reqDetailsText(req));
});

app.get('/queryParams',(req, res)=>{
    res.json({result: req.query.id})});

app.get('/routeParams/:id',(req,res) => res.json({result: req.params.id}));

app.post('/json',
        bodyparser.json(), //Adding a middleware
        (req,res) => res.json({result: req.body}));

app.post('/urlEncodedBody',
    bodyparser.urlencoded({extended:false}),
    (req,res)=>res.json({result:req.body}));

app.post('/urlEncodedExtended',
        bodyparser.urlencoded({extended:true}),
        (req,res)=>res.json({result:req.body}));

app.get('/syncError', (req, res)=> {throw 'sync errrroror';});

function asyncError(msg){
    return new Promise((resolve, reject)=> setTimeout(()=>reject(msg),10));
}

app.get('/uncaughtAsyncErr', async (req,res) => {
    await asyncError('uncaught async err');
});

app.get('/promiseCatchAsyncError', (req, res , next)=> {
    asyncError('Promise caught async err').
    catch(next);
});

app.get('/tryCatchAsyncError',async(req, res, next)=>{
    try{
        await asyncError('try-catch caught async err');
    }catch(err){
        next(err)
    }
});
const DO_CUSTOM_HANDLERS = process.argv.length > 2 ;
if(DO_CUSTOM_HANDLERS){
    app.use((req,res)=>{
      res.type('text').
      status(404).
      send(`no handler for ${req.originalUrl}\n`);
    });
    app.use((err, req, res, next) => {
        res.type('text').
        status(500).
        send(`custome error for ${req.originalUrl}\n${err}\n`);
    });
}
console.log('Hello girl')