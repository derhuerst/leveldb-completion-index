'use strict'

const doWhilst = require('async/doWhilst')
const {Writable} = require('stream')

const SEP = ':'
const BATCH_SIZE = 100

const countTokens = (tokens) => {
	const counts = Object.create(null)

	const l = tokens.length
	for (let i = 0; i < l; i++) {
		const token = tokens[i]
		if (!(token in counts)) counts[token] = 1
		else counts[token]++
	}

	return counts
}

const buildIndex = (db) => {
	let batch = []

	const addTokens = (docId, tokens, cb) => {
		const counts = countTokens(tokens)
		for (let token in counts) {
			// We abuse the fact that LevelDB sorts its keys alphabetically by
			// putting the token-in-doc frequency inside. When querying, we
			// will get those with the highest frequency first.
			const freq = counts[token] / tokens.length
			const freqKey = ('00000' + Math.round(freq * 10000)).slice(-5)
			batch.push({
				type: 'put',
				key: token + SEP + freqKey + SEP + docId,
				value: freq + ''
			})
		}

		if (batch.length >= BATCH_SIZE) {
			db.batch(batch, (err) => {
				batch = []
				cb(err)
			})
		} else cb(null)
	}

	const write = (doc, _, cb) => {
		addTokens(doc.id, doc.tokens, cb)
	}

	const writev = (docs, cb) => {
		let docsI = 0
		const iterate = (cb) => {
			const doc = docs[docsI++].chunk
			addTokens(doc.id, doc.tokens, cb)
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
}

module.exports = buildIndex
