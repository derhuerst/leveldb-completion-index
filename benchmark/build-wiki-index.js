'use strict'

const path = require('path')
const level = require('level')
const deslugify = require('wiki-article-name-encoding/decode')
const slug = require('slug')
const {parse} = require('ndjson')
const through = require('through2')

const buildIndex = require('../build-index')

const showError = (err) => {
	console.log(err)
	process.exitCode = 1
}

const db = level(path.join(__dirname, 'wiki.ldb'))

const revisionToDoc = (rev, _, cb) => {
	const name = deslugify(rev.slug)
	const tokens = name.replace(/[^\w]/, ' ').split(' ').map((s) => {
		return slug(s).toLowerCase()
	})
	cb(null, {id: rev.pageId, tokens})
}

process.stdin
.pipe(parse())
.pipe(through.obj(revisionToDoc))
.pipe(buildIndex(db))
.once('error', showError)
.once('finish', () => {
	db.close()
})
