---
name: ast-grep
description: "Performs structural code search using AST patterns. Use instead of grep/rg whenever a search depends on code structure, not just text: finding all callers of a function, all implementations of an interface, all usages of a pattern inside a specific context, or all code that is missing something (e.g. async functions without error handling). Prefer ast-grep over bash text search for any structural query. Use even when grep might work — ast-grep matches structure precisely and catches edge cases text search misses."
---

# ast-grep Code Search

## Operating Mode

- Produce a structured findings report, not an interactive REPL session.
- Test every rule on a minimal code example before running on the full codebase.
- Report the exact command used so results are reproducible by the user or a follow-on skill.
- Start simple: try a `pattern` first, add `kind` and relational rules only as needed.

## When to Use

Use **ast-grep** instead of `grep`/`rg` based on the nature of the query:

| Situation | Tool |
|---|---|
| Looking for a literal string, import path, or identifier in isolation | `grep`/`rg` |
| Finding all callers of a function (regardless of call style) | **ast-grep** |
| Finding all usages of a pattern inside a specific context (if-block, class, method) | **ast-grep** |
| Finding code that is missing a sub-pattern (no try-catch, no null check) | **ast-grep** |
| Finding all structurally equivalent forms of a pattern | **ast-grep** |
| Refactoring a name or signature with varied usage styles across many files | **ast-grep** |

When in doubt, prefer ast-grep — it matches structure precisely and won't miss variations that text search would.

## Workflow

### Step 1: Understand the Query

Clearly understand what structure to find. Clarify if needed:
- What specific code pattern or structure is the target?
- Which programming language?
- What should be included or excluded from matches?

### Step 2: Create Example Code

Write a minimal code snippet that represents what to match. Save to a temporary file for testing.

**Example:** Searching for "async functions that use await":

```javascript
// test_example.js
async function example() {
  const result = await fetchData();
  return result;
}
```

### Step 3: Write the Rule

Translate the pattern into an ast-grep rule. Start simple, add complexity only as needed.

**Key principles:**
- Always use `stopBy: end` for relational rules (`inside`, `has`)
- Use `pattern` for simple structures
- Use `kind` with `has`/`inside` for complex structures
- Combine with `all`, `any`, `not` for composite logic

**Example rule file (test_rule.yml):**
```yaml
id: async-with-await
language: javascript
rule:
  kind: function_declaration
  has:
    pattern: await $EXPR
    stopBy: end
```

See [CLI Reference](#cli-reference) below for comprehensive rule and command documentation.

### Step 4: Test the Rule

Verify the rule matches the example before running on the full codebase:

```bash
ast-grep scan --rule test_rule.yml test_example.js
```

**Debugging if no matches:**
1. Simplify the rule (remove sub-rules)
2. Add `stopBy: end` to relational rules
3. Use `--debug-query=ast` to inspect the AST structure
4. Verify `kind` values are correct for the language

### Step 5: Search the Codebase and Report

Once the rule matches the example correctly, run on the target codebase and produce a findings report using the Output Format below.

```bash
# Simple pattern search
ast-grep run --pattern 'console.log($ARG)' --lang javascript .

# Complex rule search
ast-grep scan --rule my_rule.yml /path/to/project
```

## Output Format

Produce a findings report after every search:

```md
## ast-grep Findings

**Query**: <natural language description of what was searched>
**Language**: <lang>
**Command**: <exact ast-grep command run>
**Matches**: N across M files

| File | Line | Match |
|---|---|---|
| path/to/file.js | 42 | `snippet` |

**Interpretation**: <what these findings mean for the current task>
```

If there are no matches, say so explicitly and note whether that means the pattern is absent or the rule needs refinement.

## Next Step

None — this is a support skill. Return the findings above to the calling context and continue with the current task.

---

## CLI Reference

Reference material for ast-grep commands and rule syntax. Load `references/rule_reference.md` when detailed rule documentation is needed.

### Inspect Code Structure (--debug-query)

Dump the AST structure to understand how code is parsed:

```bash
ast-grep run --pattern 'async function example() { await fetch(); }' \
  --lang javascript \
  --debug-query=cst
```

**Available formats:**
- `cst`: Concrete Syntax Tree (shows all nodes including punctuation)
- `ast`: Abstract Syntax Tree (shows only named nodes)
- `pattern`: Shows how ast-grep interprets your pattern

**Use this to:**
- Find the correct `kind` values for nodes
- Understand the structure of code you want to match
- Debug why patterns aren't matching

**Example:**
```bash
# See the structure of your target code
ast-grep run --pattern 'class User { constructor() {} }' \
  --lang javascript \
  --debug-query=cst

# See how ast-grep interprets your pattern
ast-grep run --pattern 'class $NAME { $$$BODY }' \
  --lang javascript \
  --debug-query=pattern
```

### Test Rules (scan with --stdin)

Test a rule against a code snippet without creating files:

```bash
echo "const x = await fetch();" | ast-grep scan --inline-rules "id: test
language: javascript
rule:
  pattern: await \$EXPR" --stdin
```

**Add --json for structured output:**
```bash
echo "const x = await fetch();" | ast-grep scan --inline-rules "..." --stdin --json
```

### Search with Patterns (run)

Simple pattern-based search for single AST node matches:

```bash
# Basic pattern search
ast-grep run --pattern 'console.log($ARG)' --lang javascript .

# Search specific files
ast-grep run --pattern 'class $NAME' --lang python /path/to/project

# JSON output for programmatic use
ast-grep run --pattern 'function $NAME($$$)' --lang javascript --json .
```

**When to use:**
- Simple, single-node matches
- Quick searches without complex logic
- When you don't need relational rules (inside/has)

### Search with Rules (scan)

YAML rule-based search for complex structural queries:

```bash
# With rule file
ast-grep scan --rule my_rule.yml /path/to/project

# With inline rules
ast-grep scan --inline-rules "id: find-async
language: javascript
rule:
  kind: function_declaration
  has:
    pattern: await \$EXPR
    stopBy: end" /path/to/project

# JSON output
ast-grep scan --rule my_rule.yml --json /path/to/project
```

**When to use:**
- Complex structural searches
- Relational rules (inside, has, precedes, follows)
- Composite logic (all, any, not)
- When you need the power of full YAML rules

**Tip:** For relational rules (inside/has), always add `stopBy: end` to ensure complete traversal.

### Tips for Writing Effective Rules

**Always Use stopBy: end**

For relational rules, always use `stopBy: end` unless there's a specific reason not to:

```yaml
has:
  pattern: await $EXPR
  stopBy: end
```

**Start Simple, Then Add Complexity**

1. Try a `pattern` first
2. If that doesn't work, try `kind` to match the node type
3. Add relational rules (`has`, `inside`) as needed
4. Combine with composite rules (`all`, `any`, `not`) for complex logic

**Escaping in Inline Rules**

When using `--inline-rules`, escape metavariables in shell commands:
- Use `\$VAR` instead of `$VAR`
- Or use single quotes: `'$VAR'`

```bash
# Correct: escaped $
ast-grep scan --inline-rules "rule: {pattern: 'console.log(\$ARG)'}" .
```

### Common Use Cases

**Find Functions with Specific Content**

```bash
ast-grep scan --inline-rules "id: async-await
language: javascript
rule:
  all:
    - kind: function_declaration
    - has:
        pattern: await \$EXPR
        stopBy: end" /path/to/project
```

**Find Code Inside Specific Contexts**

```bash
ast-grep scan --inline-rules "id: console-in-class
language: javascript
rule:
  pattern: console.log(\$\$\$)
  inside:
    kind: method_definition
    stopBy: end" /path/to/project
```

**Find Code Missing Expected Patterns**

```bash
ast-grep scan --inline-rules "id: async-no-trycatch
language: javascript
rule:
  all:
    - kind: function_declaration
    - has:
        pattern: await \$EXPR
        stopBy: end
    - not:
        has:
          pattern: try { \$\$\$ } catch (\$E) { \$\$\$ }
          stopBy: end" /path/to/project
```

### Resources

#### references/
Contains detailed documentation for ast-grep rule syntax:
- `rule_reference.md`: Comprehensive ast-grep rule documentation covering atomic rules, relational rules, composite rules, and metavariables

Load these references when detailed rule syntax information is needed.
