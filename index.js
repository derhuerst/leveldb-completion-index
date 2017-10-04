'use strict'

const parallel = require('async/parallel')
// const intersectionBy = require('lodash/intersectionBy')
const minBy = require('lodash/minBy')
const hifo = require('hifo')

const SEP = ':'
// const BATCH_SIZE = 100

const queryToken = (db, token, fuzzy = false) => (cb) => {
	const entries = db.createReadStream({
		gt: token + (fuzzy ? '' : SEP) + '!',
		lt: token + (fuzzy ? '' : SEP) + '~',
		reverse: true
		// todo: limit
	})
	const results = {}
	let done = false

	entries.on('data', (entry) => {
		const key = entry.key.split(SEP)
		if (key.length !== 3) return

		const docId = key[2]
		const freq = parseFloat(entry.value)
		if (!Number.isNaN(freq)) {
			if (fuzzy) {
				results[docId] = token.length / key[0].length * freq
			} else {
				results[docId] = freq
			}
		}
	})

	entries.once('error', (err) => {
		done = true
		cb(err)
	})
	entries.once('end', () => {
		if (!done) cb(null, results)
	})
}

// todo: fuzzy completion, based on partially matched tokens
const query = (db, tokens, fuzzy, cb) => {
	if ('function' === typeof fuzzy) {
		cb = fuzzy
		fuzzy = false
	} else fuzzy = !!fuzzy

	const tasks = Object.create(null)
	for (let token of tokens) tasks[token] = queryToken(db, token, fuzzy)

	parallel(tasks, (err, sets) => {
		if (err) return cb(err)

		const results = hifo(hifo.highest('relevance'), 10)

		const tokenWithLeast = minBy(tokens, t => Object.keys(sets[t]).length)
		for (let docId in sets[tokenWithLeast]) {
			let inEvery = true, relevance = 0
			for (let token of tokens) {
				const set = sets[token]

				if (docId in set) {
					relevance += set[docId]
				} else {
					inEvery = false
					break
				}
			}

			if (inEvery) results.add({docId, relevance})
		}

		cb(null, results.data)
	})
}

module.exports = query
