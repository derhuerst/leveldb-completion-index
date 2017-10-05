'use strict'

const slug = require('slug')
const path = require('path')
const level = require('level')
const prompt = require('cli-autocomplete')

const query = require('.')

const showError = (err) => {
	console.log(err)
	process.exitCode = 1
}

const strToTokens = (str) => {
	return str
	.replace(/[^\w]/, ' ')
	.split(' ')
	.map((s) => slug(s).toLowerCase())
}

const db = level(path.join(__dirname, 'benchmark', 'wiki.ldb'))

db.once('open', () => {
	prompt('foo', (str) => {
		return new Promise((yay, nay) => {
			query(db, strToTokens(str), (err, results) => {
				if (err) return nay(err)
				yay(results.map((r) => {
					return {title: r.docId + ' ' + r.relevance, value: r.docId}
				}))
			})
		})
	})
})
