'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const fromArr = require('from2-array')
const test = require('tape')

const buildIndex = require('./build-index')
const query = require('.')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const buildDb = (items, cb) => {
	const db = levelup('db', {db: memdown})

	fromArr.obj(items)
	.pipe(buildIndex(db))
	.once('error', cb)
	.once('finish', () => cb(null, db))
}

// todo: use top-level await once supported
buildDb([
	{id: 'a', tokens: ['foo', 'bar']},
	{id: 'b', tokens: ['foo', 'bar', 'baz']},
	{id: 'c', tokens: ['bar', 'baz', 'baz']}
], (err, db) => {
	if (err) return showError(err)

	test('query', (t) => {
		query(db, ['foo'], (err, results) => {
			t.deepEqual(results[0], {docId: 'a', relevance: .5})

			t.ok(results[1])
			t.equal(results[1].docId, 'b')
			t.equal(typeof results[1].relevance, 'number')
			t.equal((results[1].relevance + '').slice(0, 8), '0.333333')

			t.end()
		})
	})
})
