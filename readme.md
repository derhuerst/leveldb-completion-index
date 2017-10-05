# leveldb-completion-index

**Autocomplete search queries using [LevelDB](http://leveldb.org).**

[![npm version](https://img.shields.io/npm/v/leveldb-completion-index.svg)](https://www.npmjs.com/package/leveldb-completion-index)
[![build status](https://img.shields.io/travis/derhuerst/leveldb-completion-index.svg)](https://travis-ci.org/derhuerst/leveldb-completion-index)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/leveldb-completion-index.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)


## Installing

```shell
npm install leveldb-completion-index
```


## Usage

Let's build our index with the following data:

```js
const data = [
	{id: 'a', tokens: ['foo', 'bar']},
	{id: 'b', tokens: ['foo', 'bar', 'baz']},
	{id: 'c', tokens: ['bar', 'baz', 'baz', 'fooo']}
]
```

You are responsible to tokenise (a.k.a. split) and lower-case your search query, and to remove [stop words](https://en.wikipedia.org/wiki/Stop_words) if you want. We're going to store the built index in a LevelDB called `wiki.ldb`:

```js
const level = require('level')
const fromArr = require('from2-array')
const buildIndex = require('leveldb-completion-index/build-index')

const db = level('wiki.ldb')

fromArr.obj(data)
.pipe(buildIndex(db))
.once('finish', () => db.close())
.once('error', console.error)
```

You can then query your data at any time, because the index is persisted in `wiki.ldb`. **To perform an exact (non-fuzzy) search**:

```js
const level = require('level')
const query = require('leveldb-completion-index')

query(db, ['my', 'search', 'query'], (err, results) => {
	if (err) console.error(err)
	else console.log(results)
})
```

`results` will look like this:

```js
[
	{docId: 'a', relevance: .5},
	{docId: 'b', relevance: .33333333333}
]
```

To **perform a fuzzy search**:

```js
// note the third argument
query(db, ['my', 'search', 'query'], true, (err, results) => {
	// …
})
```

`results` will look like this:

```js
[
	{docId: 'a', relevance: .5},
	{docId: 'b', relevance: .33333333333}
	{docId: 'c', relevance: .1875}
]
```


## API

```js
query(db, tokens, fuzzy = false, cb)
```

- `db` must be a [`level`](https://www.npmjs.com/package/level) or [`levelup`](https://www.npmjs.com/package/levelup) instance.
- `tokens` must be an array, a tokenised, lower-cased and [stop-word-filtered](https://en.wikipedia.org/wiki/Stop_words) search query.
- Pass `true` for `fuzzy` to match parts of tokens, e.g. to find `foo` by `fo`.
- `cb` must be an [error-first callback](https://stackoverflow.com/a/40512067).


## Contributing

If you have a question or have difficulties using `leveldb-completion-index`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/leveldb-completion-index/issues).
