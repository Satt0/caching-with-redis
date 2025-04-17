import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('./chinook.db');

export const getData = () => {
    return new Promise((res, ej) => {
        console.log('reading db');
        db.all('select * from tracks where TrackId IN(23,45,77) limit 10;', (err, rows) => {
            if (err) {
                ej(err)
            } else {
                res(rows)
            }
        })
    })
}


