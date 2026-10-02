# @hathq/sem-lang-surface-markdown

CommonMark syntax adapter for sem-lang structured surfaces. The maintained
`mdast-util-from-markdown` parser supplies an AST and source positions; this
package projects it into the same bounded evidence contract as HTML.

Embedded HTML remains opaque syntax. It is never executed or recursively
interpreted. Link protocols are restricted to HTTP(S). This package does not
infer prose meaning or promote structural grouping candidates.
