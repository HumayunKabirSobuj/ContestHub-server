const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

var cors = require('cors')
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://assignment-12-humayun-ph-b9.netlify.app",


        ],
        credentials: true,
    })
);

app.use(express.json())
// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o9b6e9v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// console.log(uri)
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

        const userCollection = client.db("assignment-12").collection("users");
        const contestsCollection = client.db("assignment-12").collection("contests");
        const paymentsCollection = client.db("assignment-12").collection("payments");

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user)
            // console.log(user)
            // insert email if user does not exist
            // you can do this many ways(1. email unique ,, 2. upsert ,, 3. simple checking)

            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                res.send({ message: "user already exists", insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            // console.log(result)
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            // console.log(req.headers);
            const result = await userCollection.find().toArray();
            res.send(result)
        })

        app.patch('/user/admin/:id', async (req, res) => {
            const id = req.params.id;

            console.log(id)
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    role: "admin"
                }
            }

            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result)

        })
        app.patch('/user/creator/:id', async (req, res) => {
            const id = req.params.id;

            console.log(id)
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    role: "creator"
                }
            }

            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result)

        })
        app.patch('/user/user/:id', async (req, res) => {
            const id = req.params.id;

            console.log(id)
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    role: "user"
                }
            }

            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result)

        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result)
        })

        app.patch("/user/block/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    blockStatus: "block"
                }
            }

            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })
        app.patch("/user/unblock/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    blockStatus: "unblock"
                }
            }

            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })


        app.post('/contests', async (req, res) => {
            const item = req.body;
            // console.log(item)
            const result = await contestsCollection.insertOne(item)
            res.send(result)
        })

        app.get('/contests', async (req, res) => {
            console.log(req.headers);
            const result = await contestsCollection.find().toArray();
            res.send(result)
        })

        app.patch('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    status: "approved"
                }
            }

            const result = await contestsCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })


        app.delete('/contests/:id', async (req, res) => {
            const id = req.params.id;

            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await contestsCollection.deleteOne(query);
            res.send(result)
        })

        app.get('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await contestsCollection.findOne(query);
            res.send(result)
        })



        app.patch('/comment/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            console.log(data)
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    comment: data
                }
            }

            const result = await contestsCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })


        app.patch('/contests/edit/:id', async (req, res) => {
            const id = req.params.id;
            const updatedContest = req.body;
            console.log(updatedContest)
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const contest = {
                $set: {
                    ContestName: updatedContest.ContestName,
                    ContestPrice: updatedContest.ContestPrice,
                    PrizeMoney: updatedContest.PrizeMoney,
                    TaskSubmissiontextinstruction: updatedContest.TaskSubmissiontextinstruction,
                    ContestDescription: updatedContest.ContestDescription,


                }
            }

            const result = await contestsCollection.updateOne(filter, contest, options);
            res.send(result)




        })


        // payment intent

        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            console.log("amount inside the intent ", amount)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentsCollection.insertOne(payment);

            //  carefully delete each item from the cart
            console.log('payment info', payment);
            res.send(paymentResult)
            // res.send({ paymentResult });
        })

        app.post('/user_payments', async (req, res) => {
            const query = { email: req.body.email };
            const result = await paymentsCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { contestId: id };
            const result = await paymentsCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/contest/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await contestsCollection.find(query).toArray();
            res.send(result)
        })


        app.patch('/payment/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    winStatus: "win"
                }
            }

            const result = await paymentsCollection.updateOne(filter, updatedDoc);

            res.send(result)
        })


        app.patch('/contestStatus/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    winStatus: "win"
                }
            }

            const result = await contestsCollection.updateOne(filter, updatedDoc);

            res.send(result)
        })


        app.get('/payments/myEmail/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await paymentsCollection.find(query).toArray();
            const winContest = result.filter(contest => contest.winStatus === 'win')
            res.send(winContest)
        })
        


        app.get('/search', (req, res) => {
            const categoryPattern = req.query.category;
            if (!categoryPattern) {
                return res.status(400).send('Category query parameter is required');
            }

            try {
                const regex = new RegExp(categoryPattern, 'i'); 
                const results = contestsCollection.filter(item => regex.test(item.category));
                res.json(results);
            } catch (error) {
                res.status(400).send('Invalid regex pattern');
            }
        });




        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Assignment 12 server running')
})

app.listen(port, () => {
    console.log(`Server is Running on port ${port}`)
})
