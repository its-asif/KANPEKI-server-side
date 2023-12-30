const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = 8000;  
const { MongoClient, ServerApiVersion } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gf8ipgr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("KanpekiDB");
    const usersCollection = database.collection("users");
    const animeListCollection = database.collection("animelist");

    // Get all users
    app.get('/users', async(req, res) =>{
        const result = await usersCollection.find().toArray();
        res.send(result);
    })

    // create a new user
    app.post('/users', async (req, res) => {
        const userData = {
            name: req.body.displayName,
            email: req.body.email,
            photo: req.body.photoURL,
            listIds: [],
            listedAnimeIds: [],
        }

        // Check if user exists by email
        const usr = usersCollection.findOne({email: userData.email});
        if (usr) return res.send('User already exists');

        const result = await usersCollection.insertOne(userData);
        return res.send(result.insertedId);

    })



    // get anime list by email
    app.get('/animelist/:email', async(req, res) =>{
        const email = req.params.email;
        const result = await animeListCollection.find({ userEmail : email}).toArray();
        res.send(result);
    } ) 

    // create animeList 
    app.post('/animelist', async(req, res) =>{
        console.log(req.body)
        
        const result = await animeListCollection.insertOne(req.body);

        // update user listIds
        // find user by email
        const updatedUser = await usersCollection.updateOne(
            {email: req.body.userEmail},
            {$push: {listIds: result.insertedId}}
            );
            
        const userdata = await usersCollection.findOne({email: req.body.userEmail});
        console.log(userdata);

        // res.send("all good")
        res.send(result.insertedId );
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    console.log(req);
    res.send('Kanpeki server is running');
});

app.listen(port, () => {
    console.log(`KANPEKI server is running on port ${port}`);
});