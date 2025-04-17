
import { createClient } from 'redis'
import assert from 'assert'
class Cache {
    redis = createClient({
        url: 'redis://localhost:6379'
    })
    lock = new Map()
    async init() {
        await this.redis.connect()
        return this
    }
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
    async getAndSetWithLock(key, valueGetter) {
        const exist = await this.get(key)
        if (exist) return exist
        // only 1 req get and set the cache
        if (this.lock.has(key) && await this.lock.get(key)) {
            return await this.get(key)
        }

        let unlock, locker = new Promise(res => {
            // promise must resovle truthy value
            unlock = () => res(true)
        })

        this.lock.set(key, locker)


        const result = await this.set(key, await valueGetter())

        // prevent memory leak
        this.lock.delete(key)
        unlock() // release lock

        return result
    }
}
export const cache = await (new Cache().init())