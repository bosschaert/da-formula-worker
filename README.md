# sheets-worker

This worker can perform transformations on query-index.json sheets to provide
a view over them as an alternative index.

## Selecting the query index

The worker needs to be provided with the query-index.json file to use. The format for
this is:

```
curl https://worker-host/org/repo/branch/path/to/query-index.json
```

So if given the following example parameters:
* org: test-org
* repo: da-aem-boilerplate
* branch: main
* query-index path: /en/query-index.json

The basic access to the worker via curl is this:

```
curl https://workers-host/test-org/da-aem-boilerplate/main/en/query-index.json
```

Without any query, the worker will just return the original sheet unmodified.

## Querying

The query-index.json returned can be changed by specifying a query. The query is provided as URL parameter
with name `query` and the value is a JSON string.

For example to sort the query-index.json by path, the query parameter `{"sort":"path"}` is used.

```
curl https://workers-host/org/repo/main/query-index.json?query=%7B"sort":"path"%7D'
```
Note that the `{` and `}` as well as `[` and `]` characters need to be encoded on the URL.


### Filtering

There are 2 ways that filtering can be applied, which can be combined.

#### Keeping entries

You can specify what entries to keep. For example you can declare to keep only entries with a certain category.

Keeping entries that have `category=Food`:
```
{"keep":[{"category":"Food"}]}
```

Or a combined query, keep entries that have `category=Food` _and_ `region=America` OR `category=Drinks`:
```
{"keep":[{"category":"Food","region":"Americas"},{"category":"Drinks"}]}
```

#### Dropping entries

To drop entries, specify the condition for those entries. If used in combination with keeping entries, the ones specified to be dropped are removed from the end result.

For example, dropping all entries that are marked as `hide-from-sitemap=true`:
```
{"drop":[{"hide-from-sitemap":"true"}]}
```

Combined drop queries are also possible, for example to hide elements that have `hide-from-sitemap=true` OR `hide-from-sitemap=1` _and_ `nonav=1`:
```
{"drop":[{"hide-from-sitemap":"true"}, {"hide-from-sitemap":"1","nonav":"1"}]}
```

### Sorting

A single sort key can be specified on the returned result, for example to sort on the path property:

```
{"sort":"path"}
```

To ensure correct sorting on fields with numeric data, provide the `"num-sort":"true"` parameter, which converts the value to a number before calculating the sort.

## Combining sorting and filtering

For example, to sort on path and filter out no-index entries, use the following definition:

```
{"sort":"path","drop":[{"robots":"noindex"}]}
```

With URL encoding the URL including query becomes:

worker-host/org/repo/branch
```
curl 'http://worker-host/org/repo/branch/query-index.json?query=%7B"sort":"path","drop":%5B%7B"robots":"noindex"%7D%5D%7D'
```