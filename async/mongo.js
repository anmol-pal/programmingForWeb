const mongo = require('mongodb').MongoClient;
async function(mongoUrl, dbName, collectionName, id){
    try{
        const client= await mongo.connect(mongoUrl);
        const db=client.db(dbName);
        const collection=db.collection(collectionName);
        const value = await collection.findOne({_id:id});
        await client.close();
        return value;
    }catch(err){
        console.error(err);
        throw err;
    }
}