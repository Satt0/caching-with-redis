import express from 'express'
import { cache } from './cache.js'
import { getData } from './db.js'

const app = express()
app.get('/', async (req, res) => {
    res.json({
        data: await cache.getAndSetWithLock('user-key', getData)
    })
})
app.listen(3000, () => {
    console.log(`Cluster ${process.env.ID} listening at port 3000.`);
})
