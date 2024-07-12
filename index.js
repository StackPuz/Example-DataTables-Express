const express = require('express')
const mysql = require('mysql')
const util = require('util')
const config = require('./config')

let con = mysql.createConnection({
  host: config.host,
  database: config.database,
  user: config.user,
  password: config.password
})

let query = util.promisify(con.query).bind(con)

let app = express()
app.use(express.static('public'))
app.get('/api/products', async (req, res) => {
  let size = parseInt(req.query.length) || 10
  let start = parseInt(req.query.start)
  let order = mysql.raw((req.query.order && req.query.columns[req.query.order[0].column].data) || 'id')
  let direction = mysql.raw((req.query.order && req.query.order[0].dir) || 'asc')
  let params = [ order, direction, size, start ]
  let search = req.query.search.value
  let sql = 'select * from product'
  if (search) {
    search = `%${search}%`
    sql = 'select * from product where name like ?'
    params.unshift(search)
  }
  let recordsTotal = (await query('select count(*) as count from product'))[0].count
  let recordsFiltered = (await query(sql.replace('*', 'count(*) as count'), search))[0].count
  let data = (await query(`${sql} order by ? ? limit ? offset ?`, params))
  res.send({ draw: req.query.draw, recordsTotal, recordsFiltered, data })
})
app.listen(8000)