'use strict'

const slug = require('slug')
const path = require('path')
const level = require('level')
const {Suite} = require('benchmark')

const query = require('..')

const showError = (err) => {
	console.log(err)
	process.exitCode = 1
}

const A = ['republic', 'of']
const B = ['computer', 'science']

const db = level(path.join(__dirname, 'wiki.ldb'))
db.once('open', () => {
	new Suite()

	.add('exact "computer science" query', {
		defer: true,
		fn: function (def) {
			query(db, B, (err, results) => {
				if (err) def.reject(err)
				else def.resolve()
			})
		}
	})

	.add('exact "republic of" query', {
		defer: true,
		fn: function (def) {
			query(db, A, (err, results) => {
				if (err) def.reject(err)
				else def.resolve()
			})
		}
	})

	.add('fuzzy "computer science" query', {
		defer: true,
		fn: function (def) {
			query(db, B, true, (err, results) => {
				if (err) def.reject(err)
				else def.resolve()
			})
		}
	})

	.add('fuzzy "republic of" query', {
		defer: true,
		fn: function (def) {
			query(db, A, true, (err, results) => {
				if (err) def.reject(err)
				else def.resolve()
			})
		}
	})

	.on('error', (err) => {
		console.error(err)
		process.exitCode = 1
	})
	.on('cycle', (e) => {
		console.log(e.target.toString())
	})

	.run({async: true})
})
