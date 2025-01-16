module.exports = {
  extends: [],
  plugins: [],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  env: {
    es2021: true,
    node: false,
    browser: true
  },
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "LogicalExpression[operator='||=']",
        message: 'Logical OR assignment (||=) is not allowed.',
      },
      {
        selector: "LogicalExpression[operator='&&=']",
        message: 'Logical AND assignment (&&=) is not allowed.',
      },
      {
        selector: "LogicalExpression[operator='??=']",
        message: 'Nullish coalescing assignment (??=) is not allowed.',
      },
      {
        selector: "CallExpression[callee.property.name='replaceAll']",
        message: 'String.prototype.replaceAll is not allowed.',
      },
      {
        selector: "CallExpression[callee.object.name='Promise'][callee.property.name='any']",
        message: 'Promise.any is not allowed.',
      },
      {
        selector: "NewExpression[callee.name='WeakRef']",
        message: 'WeakRef is not allowed.',
      },
      {
        selector: "NewExpression[callee.name='FinalizationRegistry']",
        message: 'FinalizationRegistry is not allowed.',
      },
      {
        selector: "NumericLiteral[raw*='_']",
        message: 'Numeric separators (e.g., 1_000) are not allowed.',
      },
      // {
      //   selector: "CallExpression[callee.property.name='finally']",
      //   message: "Promise.prototype.finally is not allowed.",
      // },
      {
        selector: "NewExpression[callee.name='AggregateError']",
        message: 'AggregateError is not allowed.',
      },
      {
        selector: "CallExpression[callee.object.name='Intl'][callee.property.name='ListFormat']",
        message: 'Intl.ListFormat is not allowed.',
      },
      {
        selector:
          "CallExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
        message: 'Intl.DateTimeFormat with dateStyle/timeStyle is not allowed.',
      },
    ],
    '@typescript-eslint/*': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-unnecessary-type-arguments': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/no-unnecessary-catch': 'off',
    '@typescript-eslint/no-unnecessary-qualifier': 'off',
    '@typescript-eslint/no-implied-eval': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-array-constructor': 'off',
    '@typescript-eslint/no-extra-semi': 'off',
    'semi': 'off',
    'no-empty': 'off',
    'no-cond-assign': 'off',
    'no-dupe-else-if': 'off',
    'no-dupe-keys': 'off',
    'no-duplicate-case': 'off',
    'no-empty-character-class': 'off',
    'no-ex-assign': 'off',
    'no-extra-boolean-cast': 'off',
    'no-extra-semi': 'off',
    'no-constant-condition': 'off',
    'no-func-assign': 'off',
    'no-constant':'off',
    'no-redeclare':'off',
    'no-import-assign': 'off',
    'no-inner-declarations': 'off',
    'no-invalid-regexp': 'off',
    'no-irregular-whitespace': 'off',
    'no-loss-of-precision': 'off',
    'no-misleading-character-class': 'off',
    'no-obj-calls': 'off',
    'no-prototype-builtins': 'off',
    'no-regex-spaces': 'off',
    'no-sparse-arrays': 'off',
    'no-template-curly-in-string': 'off',
    'no-unexpected-multiline': 'off',
    'no-unreachable': 'off',
    'no-unsafe-finally': 'off',
    'no-unsafe-negation': 'off',
    'no-unsafe-optional-chaining': 'off',
    'no-useless-backreference': 'off',
    'no-fallthrough': 'off',
    'no-unsafe-assignment': 'off',
    'no-unsafe-call': 'off',
    'no-unsafe-member-access': 'off',
    'no-unsafe-argument': 'off',
    'no-unsafe-return': 'off',
    'no-useless-escape': 'off',
    'no-useless-catch': 'off',
    'no-useless-return': 'off',
    'no-useless-rename': 'off',
    'no-undef': 'off',
    'use-isnan': 'off',
    'valid-typeof': 'off',
    'prefer-template': 'off',
    'no-case-declarations': 'off',
    'no-control-regex': 'off',
    'no-self-assign': 'off',
    'getter-return': 'off',
    'no-for-in-array': 'off',
    '@typescript-eslint/no-for-in-array': 'off',
    'node/no-deprecated-api': 'off',
  },
};
