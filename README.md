# Implement robust caching with redis
## Context
     When a data is not present in caching (expired or at startup), many concurrent requests want to access that data. This can cause overload to database.
## Solution
    Use blocking mechanism so that only first request that will get and set the data to cache. The blocking logic should run fast and not add pain point to existing system
## Tools
    1. Redis: fast, scalable caching storage
    2. Promise: suitable for this solution
    3. Express: use as example RESTFul server. can be any frameworks
## Implementation
### Setup Cache class with redis connection

```js 
class Cache {
    redis = createClient({
        url: 'redis://localhost:6379'
    })
    lock = new Map()
    async init() {
        await this.redis.connect() // connect redis when init
        return this
    }
```
###  Getter and setter wrapper for redis
```js 
 // expect all data is json.
    async get(key) {
        return JSON.parse(await this.redis.get(key))
    }
    async set(key, value) {
        const result = await this.redis.set(key, JSON.stringify(value), { EX: 10 })
        assert(result.toUpperCase() === 'OK', 'Cannot set value to redis' + result)
        return value
    }
    //
```
### Implement the solution
  
> This implementation focus on the caching technique. Redis, database, api setups are pretty simple and not production ready.

```js
async getAndSetWithLock(key, valueGetter) {
        const exist = await this.get(key) // if a cache is hit, return it
        if (exist) return exist
        // we miss a cache here
        // Incomming requests check if there is a request that's processing the missed cache. 
        // `this.lock.get(key)` will return a promise that's only resolved only when the cache is renewed.
        if (this.lock.has(key) && await this.lock.get(key)) {
            return await this.get(key)
        }
        
        // create a non-resolved promised and a function to resolve it manually later.
        let unlock, locker = new Promise(res => {
            // promise must resovle truthy value
            unlock = () => res(true)
        })
        // mark this `key` under processing and block other requests retrieving it.
        this.lock.set(key, locker)

        // Get and Set the cache.
        const result = await this.set(key, await valueGetter())

        // now the cache is ready, let's release the lock. Deleting the lock after use make it not leaking memory.
        this.lock.delete(key)
        unlock()

        return result
    }

```
### Finally export the cache with inited redis connection, this is for demonstration

```js
export const cache = await (new Cache().init())
```

### Setup express

```js
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

```
### Set up database, reuse from [sqlitetutorial/sqlite-sample-database](https://www.sqlitetutorial.net/sqlite-sample-database/)

```js
import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('./chinook.db');

export const getData = () => {
    return new Promise((res, ej) => {
        db.all('select * from tracks limit 10;', (err, rows) => {
            if (err) {
                ej(err)
            } else {
                res(rows)
            }
        })
    })
}

```

## Conlusion
 - This is non-distributed locking mechanism, which is suitable if your app only consists of a few instances
 - The implementation is passive caching, others proactive method that prepares the cache beforehand are more suitable with frequently changing data.
 - My main goals for these types of repository is to share my experience and solutions, Wellcome any opinions from the Internet!