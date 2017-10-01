'use strict'

const doWhilst = require('async/doWhilst')
const {Writable} = require('stream')

const SUM = Symbol.for('sum')
const SEP = ':'
const BATCH_SIZE = 100
// const BATCH_SIZE = 1

const countTokens = (tokens) => {
	const counts = Object.create(null)
	let sum = 0

	const l = tokens.length
	for (let i = 0; i < l; i++) {
		const token = tokens[i]
		sum++
		if (!(token in counts)) counts[token] = 1
		else counts[token]++
	}
	counts[SUM] = sum

	return counts
}

const buildIndex = (db) => {
	let batch = []

	const write = (doc, _, cb) => {
		const counts = countTokens(doc.tokens)
		for (let token in counts) {
			batch.push({
				type: 'put',
				key: token + SEP + doc.id,
				value: counts[SUM]
			})
		}

		if (batch.length >= BATCH_SIZE) {
			db.batch(batch, (err) => {
				batch = []
				cb(err)
			})
		} else cb(null)
	}

	const writev = (docs, cb) => {
		let docsI = 0
		const iterate = (cb) => {
			const doc = docs[docsI]
			docsI++

			const counts = countTokens(doc.tokens)
			for (let token in counts) {
				batch.push({
					type: 'put',
					key: token + SEP + doc.id,
					value: counts[SUM]
				})
			}

			if (batch.length >= BATCH_SIZE) {
				db.batch(batch, (err) => {
					batch = []
					cb(err)
				})
			} else cb(null)
		}

		const test = () => docsI < docs.length
		doWhilst(iterate, test, cb)
	}

	const final = (cb) => {
		db.batch(batch, (err) => {
			batch = []
			cb(err)
		})
	}

	return new Writable({objectMode: true, write, writev, final})
	// return {write, writev, final}
}

module.exports = buildIndex
