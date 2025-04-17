import http from 'k6/http'
import { check, sleep } from 'k6'
export const options = {
    vus: 10000, // Number of virtual users
    duration: '30s', // Duration of the test
};
export default function () {
    let res = http.get('http://localhost:3000')

    check(res, { 'success call': (r) => r.status === 200 })

    sleep(0.3)
}
