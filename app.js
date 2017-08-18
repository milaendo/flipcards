const express = require('express')
const app = express()
const path = require('path')
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser')
const config = require('config')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mysql = require('mysql')

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache')
app.use(express.static(path.join(__dirname, 'static')))


const conn = mysql.createConnection({
  host: config.get('db.host'),
  database: config.get('db.database'),
  user: config.get('db.user'),
  password: config.get('db.password')
})

function Authenticate(req, res, next){
	const token = req.get("Authorization")
	const sql =`
SELECT * FROM users
WHERE token = ?
	`
	conn.query(sql, [token],function(err, results, fields){
		if (results.length > 0){
			res.locals.userid = results[0].id
			next()
		}
		else {
			res.status(401).json({
				message: "respect my authoritah"
			})
		}
	})
}

// tested
app.post("/token", function(req,res,next){
	const username = req.body.username
	const password = req.body.password 
	const sql = ` SELECT password FROM users WHERE username = ? `

	conn.query(sql, [username], function (err, results, field){
		const hashedPword = results[0].password

		bcrypt.compare(password, hashedPword).then (function(match){
			if (match){
				const token = uuid ()

				const tokenUpsql =`
					UPDATE users 
					SET token = ?
					WHERE username = ?
				`

				conn.query(tokenUpsql, [token, username], function(err, results, fields){
					res.json({
						token: token,
						message: "you may enter"
					})
				})
				
			} else {
				res.status(401).json({
					message: "you shall not pass"
				})
			
			}
			
		})
	})
})

// tested
app.post("/register", function(req, res, next){
	const username = req.body.username
	const password = req.body.password 
	const token = uuid()
	const sql = ` INSERT INTO users (username, password, token) VALUES (?, ?, ?)`

	bcrypt.hash(password,10).then(function(hashedPword){
		conn.query(sql, [username, hashedPword, token],function(err, results, fields){
			if (err){
				res.json({
					message: "not successfully registered",
					err
				})
			}
			else {
				console.log("results",results)
				res.json({
					message: "user succesfully created",
					token: token
				})}	
		})
	})
})

// tested
app.get("/api/flipcards", Authenticate, function(req, res, next){
	const sql = `select * from flipcards`

	conn.query(sql, function(err, results, fields){
		if (err){
			res.json({
				message: EEERRROR,
				err
			})
		}
		else {
			res.json({
				message: "success!",
				results
			})
		}
		
	})
})

// tested
app.post("/api/newdeck",function(req, res, next){
	const name = req.body.name
	const sql = `insert into decks (name) values (?)`
	conn.query(sql, [name], function(err, results, fields){
		if (err){
			res.json({
				message: "New deck was NOT created",
				err
			})
		}
		else {
			res.json({
				message: "new deck created",
				results
			})
		}
	})
})

// tested 
app.post("/api/deck/:id/newflipcard", function(req, res, next){
	const id = req.params.id
	const question = req.body.question
	const answer = req.body.answer
	const sql = `insert into flipcards (deckid,question, answer) values (?, ?, ?)`

	conn.query(sql,[id, question, answer], function(err, results, fields){
		if(err){
			res.json({
				message: "new card not created",
				err
			})
		}
		else {
			res.json({
				message :"new card added",
				results
			})
		}
	})
})

//tested
app.patch("/api/flipcards/:id", function(req, res, next){
	const id = req.params.id
	const question = req.body.question
	const answer = req.body.answer
	const sql = `update flipcards set question = ?, answer = ? where id = ? `

	conn.query(sql, [question, answer, id], function(err, results, fields){
		if(err){
			res.json({
				message: "not updated",
				err
			})
		}
		else{
			res.json({
				message: "card updated",
				results
			})
		}
	})
})

//tested
app.delete("/api/flipcards/:id", function(req, res, next){
	const id = req.params.id
	const sql = `delete from flipcards where id = ?`

	conn.query(sql [id], function(err, results, fields){
		if(err){
			res.json({
				message: "cant delete",
				err
			})
		}
		else{
			res.json({
				message: "succesfully deleted"
			})
		}
	})
})
app.listen(3000, function(){
  console.log("App running on port 3000")
})
