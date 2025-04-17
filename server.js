import express from 'express'
import { cache } from './cache.js'
import cluster from 'cluster'
import os from 'os'
import { getData } from './db.js'

if (cluster.isPrimary) {
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork({ ID: i })
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(worker, code, signal);
    })
} else {
    const app = express()
    app.get('/', async (req, res) => {
        // console.log(`Cluster ${process.env.ID} getting request.`);
        res.json({
            data: await cache.getAndSetWithLock('user-key', getData)
        })
    })
    app.listen(3000, () => {
        console.log(`Cluster ${process.env.ID} listening at port 3000.`);
    })
}