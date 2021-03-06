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
	{id: 'c', tokens: ['bar', 'baz', 'baz', 'fooo']}
], (err, db) => {
	if (err) return showError(err)

	test('query', (t) => {
		query(db, ['foo'], (err, results) => {
			t.ok(Array.isArray(results))
			t.equal(results.length, 2)

			t.deepEqual(results[0], {docId: 'a', relevance: .5})

			t.ok(results[1])
			t.equal(results[1].docId, 'b')
			t.equal(typeof results[1].relevance, 'number')
			t.equal((results[1].relevance + '').slice(0, 8), '0.333333')

			t.end()
		})
	})

	test('fuzzy', (t) => {
		query(db, ['foo'], true, (err, results) => {
			t.ok(Array.isArray(results))
			t.equal(results.length, 3)

			t.deepEqual(results[0], {docId: 'a', relevance: .5})

			t.ok(results[1])
			t.equal(results[1].docId, 'b')
			t.equal(typeof results[1].relevance, 'number')
			t.equal((results[1].relevance + '').slice(0, 8), '0.333333')

			t.ok(results[2])
			t.equal(results[2].docId, 'c')
			t.equal(typeof results[2].relevance, 'number')
			t.equal(results[2].relevance, 0.1875)

			t.end()
		})
	})
})
